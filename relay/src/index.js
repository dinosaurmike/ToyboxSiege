// Toybox Siege multiplayer relay (Cloudflare Worker + Durable Objects).
//
// Each game room (the `room` code in the game's URL) is one Durable Object holding that table's sockets.
// The relay gives each phone a player slot, announces arrivals and departures, and forwards every game
// message (arena sync, aim, fire, hit, turn, reload, ...) to the other phones in the same room. It never
// looks inside the messages. Uses the WebSocket Hibernation API, so an idle room costs nothing.

const ALLOWED_ORIGINS = ['https://dinomike.ca', 'https://www.dinomike.ca'];
const MAX_PLAYERS = 8;            // the game's invite link counts up to 8
const MAX_MESSAGE = 64 * 1024;    // bytes; game messages are a few hundred

function allowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') return new Response('Toybox Siege relay is running.\n');
    if (url.pathname !== '/ws') return new Response('Not found\n', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket\n', { status: 426 });
    if (!allowedOrigin(request.headers.get('Origin') || '')) return new Response('Forbidden\n', { status: 403 });
    const room = (url.searchParams.get('room') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
    if (!room) return new Response('Missing room\n', { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(room)).fetch(request);
  }
};

export class Room {
  constructor(state) {
    this.state = state;
  }

  players() {
    const list = [];
    for (const ws of this.state.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a && !a.gone) list.push({ ws, slot: a.slot, clientId: a.clientId });
    }
    return list;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const clientId = (url.searchParams.get('clientId') || '').slice(0, 32);
    const wanted = parseInt(url.searchParams.get('player') || '', 10);
    const current = this.players();

    // A phone reconnecting (same clientId) keeps its slot; its old socket is closed quietly.
    let slot = null;
    for (const p of current) {
      if (clientId && p.clientId === clientId) {
        slot = p.slot;
        p.ws.serializeAttachment({ slot: p.slot, clientId: p.clientId, gone: true });
        try { p.ws.close(4000, 'replaced'); } catch {}
      }
    }
    const others = current.filter(p => p.slot !== slot);
    const taken = new Set(others.map(p => p.slot));
    if (slot === null) {
      if (wanted >= 1 && wanted <= MAX_PLAYERS && !taken.has(wanted)) slot = wanted;
      else for (let s = 1; s <= MAX_PLAYERS; s++) if (!taken.has(s)) { slot = s; break; }
    }
    if (slot === null) return new Response('Room is full\n', { status: 409 });

    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ slot, clientId, gone: false });
    const roomSize = others.length + 1;
    server.send(JSON.stringify({ type: 'init', playerNumber: slot, roomSize }));
    const joined = JSON.stringify({ type: 'player_joined', playerNumber: slot, roomSize });
    for (const p of others) { try { p.ws.send(joined); } catch {} }
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, message) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE) return;
    for (const p of this.players()) if (p.ws !== ws) { try { p.ws.send(message); } catch {} }
  }

  webSocketClose(ws, code) {
    this.leave(ws);
    try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'bye'); } catch {}
  }

  webSocketError(ws) {
    this.leave(ws);
  }

  leave(ws) {
    const a = ws.deserializeAttachment();
    if (!a || a.gone) return;               // replaced by a reconnect: not a real departure
    ws.serializeAttachment({ ...a, gone: true });
    const rest = this.players();
    const left = JSON.stringify({ type: 'player_left', playerNumber: a.slot, roomSize: rest.length });
    for (const p of rest) { try { p.ws.send(left); } catch {} }
  }
}

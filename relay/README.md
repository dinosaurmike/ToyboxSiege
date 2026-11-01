# Toybox Siege relay

The multiplayer server for [Toybox Siege](../README.md): a Cloudflare Worker with one
[Durable Object](https://developers.cloudflare.com/durable-objects/) per game room.

* Players connect to `wss://<relay>/ws?room=<code>&player=<n>&clientId=<id>`.
* The relay gives each phone a player slot (1 to 8; a reconnecting phone keeps its slot), sends it
  `{"type":"init","playerNumber","roomSize"}`, tells the others `player_joined` / `player_left`, and forwards every
  other message to the rest of the room unchanged. It doesn't store or read game data.
* Only pages from dinomike.ca (and localhost, for testing) may connect. Rooms are isolated by their code.
* WebSocket Hibernation keeps idle rooms free. It runs on Cloudflare's free Workers plan.

## Deploy (no command line)

Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → this repo →
project name **`toybox-siege-relay`**, deploy command **`npx wrangler deploy`**, root directory **`relay`**.
Every push to the repo redeploys it. The game reads the relay's address from
`<meta name="toybox-relay">` in `index.html`.

## Run locally

```bash
cd relay && npm install && npx wrangler dev        # relay on ws://127.0.0.1:8787
```
Point the meta tag at `ws://127.0.0.1:8787` and serve the game from `localhost`.

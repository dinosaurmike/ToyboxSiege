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

GitHub deploys it: `.github/workflows/deploy-relay.yml` runs `wrangler deploy` in this folder whenever `relay/`
changes (or from the **Actions** tab → **Deploy relay** → **Run workflow**). It needs two repository secrets
(**Settings → Secrets and variables → Actions**): `CLOUDFLARE_API_TOKEN`, a Cloudflare API token made from the
**Edit Cloudflare Workers** template, and `CLOUDFLARE_ACCOUNT_ID`. The relay's address is printed at the end of the
run: `https://toybox-siege-relay.<your-subdomain>.workers.dev`. The game reads it from
`<meta name="toybox-relay">` in `index.html` (as `wss://…`).

## Run locally

```bash
cd relay && npm install && npx wrangler dev        # relay on ws://127.0.0.1:8787
```
Point the meta tag at `ws://127.0.0.1:8787` and serve the game from `localhost`.

# Toybox Siege: guide for contributors and AI coding assistants

Toybox Siege is a mixed-reality tabletop physics game by Mike Warren ([dinosaurmike](https://github.com/dinosaurmike)):
a toy-block battlefield is placed on a real table (WebXR AR, or over the camera feed), and players knock down each
other's castles with a slingshot catapult. Live at <https://dinomike.ca/ToyboxSiege/>. All rights reserved (see
`LICENSE`).

## What this repository contains

* **The built game only** (a Vite production build): `index.html` (markup and inline CSS for the HUD, menus and
  splash screen) and `assets/index-<hash>.js` (one module: Three.js, the physics engine, the game, QR codes).
  The original source project is not in this repository yet; when it is added, update this file and the README.
* `docs/images/`: `toybox-siege-header.gif` (README) and `toybox-siege-social.png` (GitHub social preview,
  1280 × 640). `docs/images/source/` has the scripts that make them: `record.js` plays the game in headless
  Chromium on a virtual clock (`vclock.js`) with a still wooden tabletop (`table.png`) as the camera, and
  `make-gif.py` composites the frames into the phone in `banner.html`. The commands are in `record.js`.

## How the game behaves

* **AR:** `navigator.xr` `immersive-ar` with `hit-test` and a DOM overlay where available; otherwise
  `getUserMedia` (rear camera) behind a transparent WebGL canvas. The camera needs HTTPS on phones.
* **Placement flow:** splash → START → choose the arena shape and height → ✅ → battle. Aim by dragging down in
  the lower half of the screen (the slingshot zone); the upper half orbits the view.
* **Multiplayer:** a WebSocket to `wss://<same host>/ws` carries arena sync, shots and reloads. The relay server is
  **not** in this build. On a static host (dinomike.ca on Netlify) the socket fails and retries every 3 s;
  the game plays solo. Restoring multiplayer needs a small relay (for example a serverless WebSocket service) and
  a matching URL in the source.
* No API keys or accounts.

## Hosting

Static files with relative paths (`./assets/...`), so the game runs from any folder. On dinomike.ca it lives at
`/ToyboxSiege/`. `/SiegeEngine/` is an identical older copy kept for old links; redirects for `/toybox`,
`/toybox-siege` and lowercase paths are in the website's `_redirects`.

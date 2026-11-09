# CODEIN.it collaboration server

A Yjs WebSocket server backing collaborative playground sessions. One Y.Doc per
room; rooms are created on demand when the first client connects.

## Running locally

```bash
npm install          # from this directory, it has its own manifest
npm start            # listens on :1234
```

Or from the repo root, alongside the React dev server:

```bash
npm run dev          # CRA on :3000 and this on :1234
```

Health check: `curl localhost:1234/health` → `{"ok":true,"rooms":0,"conns":0}`

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `1234` | Listen port |
| `HOST` | `0.0.0.0` | Listen address |
| `ALLOWED_ORIGINS` | `*` | Comma-separated origin allowlist. **Set this in production.** |
| `MAX_ROOMS` | `200` | Global room cap |
| `MAX_CONNS_PER_ROOM` | `12` | Per-room connection cap |
| `ROOM_TTL_MS` | `1800000` | How long an empty room survives before being freed |

## Deployment

**This cannot run on Vercel.** Serverless functions cannot hold a WebSocket
open. The React app stays on Vercel; this server needs a host that runs a
persistent process — Fly.io, Railway, Render, or any VPS.

Two things must be set up correctly:

1. **Serve over `wss://`, not `ws://`.** The site is HTTPS, so a `ws://` URL is
   blocked as mixed content, and the browser reports it as a generic network
   failure. Fly/Railway/Render all terminate TLS and forward, so
   `wss://your-app.fly.dev` works with no extra configuration.

2. **Pin to a single instance** (`min = max = 1`). Rooms live in process
   memory. With two instances behind a load balancer, two people opening the
   same link can land on different processes and see empty, independent
   documents — with no error anywhere. That is the worst failure mode
   available, because it looks like it is working. Scaling out requires shared
   state between processes (`y-redis`).

Set `ALLOWED_ORIGINS` to your deployed frontend origin, then point the frontend
at this server with `REACT_APP_COLLAB_WS_URL=wss://...`.

## Security posture

There is **no authentication**. Anyone with a room id has full read/write
access to that document. Room ids are UUIDv4 so they are unguessable, but they
are permanent and cannot be revoked once shared.

What is enforced: the origin allowlist (browsers do not apply CORS to
WebSockets, so this is the only thing stopping other sites from opening sockets
using a visitor's browser), room-id shape validation, a per-room connection
cap, and a global room cap.

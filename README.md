# UB-Share Signaling Server

Lightweight WebSocket server for peer discovery and WebRTC signaling. No files pass through this server — it only relays connection handshakes.

## What It Does

1. **Peer registration** — peers connect and announce themselves
2. **Peer discovery** — peers can see who else is online
3. **WebRTC signaling** — relays SDP offers/answers and ICE candidates
4. **Shared file catalog** — peers broadcast their shared file list

Once two peers establish a WebRTC DataChannel, the signaling server is no longer involved in the transfer.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Uses `tsx watch` for auto-reload on changes.

## Production

```bash
npm run build    # Compile TypeScript → dist/
npm start        # Run compiled JS
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (status, uptime, peer count) |
| GET | `/api/peers` | List online peers |
| GET | `/api/peers/count` | Online peer count |

## Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `peer:register` | `{ peerId, displayName, sharedFiles }` | Register as online |
| `peer:update-files` | `{ files }` | Update shared file list |
| `signal:offer` | `{ targetPeerId, offer }` | Send WebRTC SDP offer |
| `signal:answer` | `{ targetPeerId, answer }` | Send WebRTC SDP answer |
| `signal:ice-candidate` | `{ targetPeerId, candidate }` | Send ICE candidate |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `peer:joined` | `PeerInfo` | A new peer came online |
| `peer:left` | `{ peerId }` | A peer went offline |
| `peer:list` | `PeerInfo[]` | Full list of online peers |
| `signal:offer` | `{ fromPeerId, offer }` | Incoming WebRTC offer |
| `signal:answer` | `{ fromPeerId, answer }` | Incoming WebRTC answer |
| `signal:ice-candidate` | `{ fromPeerId, candidate }` | Incoming ICE candidate |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo
4. Set **Root Directory** to `server`
5. **Build Command:** `npm install && npm run build`
6. **Start Command:** `npm start`
7. Select **Free** plan
8. Deploy

Or use the Blueprint: Dashboard → **Blueprints** → connect repo → Render auto-detects `render.yaml`.

Your server will be at `https://your-service.onrender.com`.

> **Note:** Free tier spins down after 15 min of inactivity. First connection after spin-down takes ~30s.

### After deployment

Update the desktop app's signaling server URL:
**Settings → Network → Signaling Server URL** → `https://your-service.onrender.com`

## Project Structure

```
server/
├── src/
│   ├── index.ts           ← Express + Socket.IO entry
│   ├── signaling.ts       ← Socket event handlers
│   └── peer-manager.ts    ← In-memory peer registry
├── package.json
├── tsconfig.json
├── render.yaml            ← Render deployment config
└── railway.json           ← Railway deployment config
```

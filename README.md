# UB-Share Signaling Server

**A lightweight matchmaker — not a file server.**

This is the signaling server for UB-Share. It helps devices find each other and establish direct connections. That's it. No files ever pass through this server, no data is stored, and no heavy processing happens here.

---

## What This Server Does

The signaling server has exactly **three jobs**:

### 1. Peer Registration
When a UB-Share device comes online, it registers with this server — announcing its peer ID and display name. When it goes offline, it's removed.

### 2. Peer Discovery
Devices can see who else is online. The server maintains a simple in-memory list of connected peers and broadcasts join/leave events in real time.

### 3. WebRTC Handshake Relay
When two devices want to connect, they need to exchange a small amount of connection metadata (SDP offers, SDP answers, ICE candidates). The signaling server relays these messages between the two peers. This handshake is typically a few kilobytes and takes less than a second.

**Once the handshake completes, the server is done.** The two devices establish a direct WebRTC DataChannel and transfer files between themselves at full speed — the server plays no further role.

---

## What This Server Does NOT Do

| ❌ | Description |
|----|-------------|
| **No file storage** | Files never touch this server. Zero disk usage for transfers. |
| **No file relay** | Data flows directly between peers, not through the server. |
| **No user accounts** | No sign-ups, no passwords, no databases. |
| **No persistent storage** | All state is in-memory. Restart the server and it starts fresh. |
| **No heavy compute** | Just a WebSocket relay. A free-tier cloud instance handles thousands of peers. |
| **No file metadata** | The server doesn't know what files are being sent, their names, or sizes. |

---

## Architecture

```
┌──────────┐        WebSocket        ┌──────────┐
│ Device A │ ◄─────────────────────► │  Server  │
└──────────┘                         │          │
                                     │  (relay  │
┌──────────┐        WebSocket        │  only)   │
│ Device B │ ◄─────────────────────► │          │
└──────────┘                         └──────────┘
      ▲                                    
      │      Direct WebRTC DataChannel     
      │◄══════════════════════════════►    
      │   (Server not involved here)       
      ▼                                    
┌──────────┐                               
│ Device A │                               
└──────────┘                               
```

The server is a **stateless WebSocket relay**. It uses:
- **Express** — health check endpoint
- **Socket.IO** — real-time bidirectional communication
- **In-memory peer registry** — no database needed

---

## Resource Usage

This server is intentionally minimal:

| Resource | Usage |
|----------|-------|
| **Memory** | ~50 MB base + ~1 KB per connected peer |
| **CPU** | Negligible — just relaying small JSON messages |
| **Disk** | Zero — no files stored, no database |
| **Bandwidth** | Minimal — only handshake messages (a few KB per connection) |
| **Startup** | < 1 second |

A **free-tier Render/Railway instance** is more than enough to serve hundreds of concurrent peers.

---

## Hosting

The server is designed to run on any free cloud platform:

- **Render** — free web service tier (auto-sleeps after 15 min idle)
- **Railway** — free starter plan
- **Fly.io** — free tier with persistent VMs
- **Any VPS** — minimal resources needed

> **Free tier note:** Platforms like Render spin down free services after inactivity. The first connection after spin-down takes ~30 seconds. After that, it stays warm as long as peers are connected.

---

## API

### Health Check

```
GET /health
```

Returns server status, uptime, and connected peer count. Useful for monitoring and keep-alive pings.

### Peer Count

```
GET /api/peers/count
```

Returns the number of currently connected peers.

---

## Privacy

- The server **never** sees file contents, filenames, or file sizes
- Connection metadata (SDP/ICE) is relayed in real-time and **never stored**
- Peer lists are in-memory only — lost on server restart
- No logging of transfer activity
- No analytics, no tracking, no telemetry

The server is open source. You can inspect every line, host your own instance, and verify that no data is collected.

---

## License

MIT

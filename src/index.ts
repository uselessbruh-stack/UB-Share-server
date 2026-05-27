// ===================================================================
// UB-Share — Signaling Server Entry Point
// Express + Socket.IO server for peer discovery and WebRTC signaling
// ===================================================================

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerSignalingHandlers } from './signaling.js'
import { peerManager } from './peer-manager.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
})

// ----- REST Endpoints -----

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    peers: peerManager.getCount(),
    timestamp: new Date().toISOString()
  })
})

app.get('/api/peers/count', (_req, res) => {
  res.json({ count: peerManager.getCount() })
})

app.get('/api/peers', (_req, res) => {
  const peers = peerManager.getOnlinePeers()
  res.json(
    peers.map((p) => ({
      peerId: p.peerId,
      displayName: p.displayName,
      sharedFiles: p.sharedFiles.length,
      connectedAt: p.connectedAt
    }))
  )
})

// ----- Socket.IO Signaling -----

registerSignalingHandlers(io)

// ----- Start Server -----

httpServer.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║     UB-Share Signaling Server            ║
  ║     Running on port ${PORT}                 ║
  ║                                          ║
  ║     Health: http://localhost:${PORT}/health  ║
  ║     Peers:  http://localhost:${PORT}/api/peers ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `)
})

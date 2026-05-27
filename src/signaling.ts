// ===================================================================
// UB-Share — Signaling Handler
// Socket.IO event handlers for WebRTC signaling and peer discovery
// ===================================================================

import { Server, Socket } from 'socket.io'
import { peerManager } from './peer-manager.js'

/**
 * Register all signaling event handlers on a Socket.IO server
 */
export function registerSignalingHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Signaling] New connection: ${socket.id}`)

    // ----- Peer Registration -----

    socket.on('peer:register', (data: { peerId: string; displayName: string; sharedFiles?: any[] }) => {
      const { peerId, displayName, sharedFiles = [] } = data
      const peer = peerManager.register(socket.id, peerId, displayName, sharedFiles)

      // Notify all other peers
      socket.broadcast.emit('peer:joined', {
        peerId: peer.peerId,
        displayName: peer.displayName,
        sharedFiles: peer.sharedFiles
      })

      // Send current peer list to the new peer
      const onlinePeers = peerManager.getOnlinePeers(socket.id)
      socket.emit('peer:list-updated', onlinePeers.map((p) => ({
        peerId: p.peerId,
        displayName: p.displayName,
        sharedFiles: p.sharedFiles
      })))

      console.log(`[Signaling] Peer registered: ${displayName} (${peerId}). Total online: ${peerManager.getCount()}`)
    })

    // ----- Peer List Request -----

    socket.on('peer:list', () => {
      const onlinePeers = peerManager.getOnlinePeers(socket.id)
      socket.emit('peer:list-updated', onlinePeers.map((p) => ({
        peerId: p.peerId,
        displayName: p.displayName,
        sharedFiles: p.sharedFiles
      })))
    })

    // ----- Update Shared Files -----

    socket.on('peer:update-files', (data: { sharedFiles: any[] }) => {
      peerManager.updateSharedFiles(socket.id, data.sharedFiles)
      const peer = peerManager.getBySocketId(socket.id)
      if (peer) {
        socket.broadcast.emit('peer:files-updated', {
          peerId: peer.peerId,
          sharedFiles: data.sharedFiles
        })
      }
    })

    // ----- WebRTC Signaling: Offer -----

    socket.on('signal:offer', (data: { targetPeerId: string; sdp: string }) => {
      const senderPeer = peerManager.getBySocketId(socket.id)
      if (!senderPeer) {
        socket.emit('signal:error', { message: 'You are not registered' })
        return
      }

      const targetSocketId = peerManager.getSocketId(data.targetPeerId)
      if (!targetSocketId) {
        socket.emit('signal:error', { message: 'Target peer is not online' })
        return
      }

      io.to(targetSocketId).emit('signal:offer-received', {
        peerId: senderPeer.peerId,
        peerName: senderPeer.displayName,
        sdp: data.sdp
      })

      console.log(`[Signaling] Relayed offer: ${senderPeer.peerId} → ${data.targetPeerId}`)
    })

    // ----- WebRTC Signaling: Answer -----

    socket.on('signal:answer', (data: { targetPeerId: string; sdp: string }) => {
      const senderPeer = peerManager.getBySocketId(socket.id)
      if (!senderPeer) return

      const targetSocketId = peerManager.getSocketId(data.targetPeerId)
      if (!targetSocketId) return

      io.to(targetSocketId).emit('signal:answer-received', {
        peerId: senderPeer.peerId,
        sdp: data.sdp
      })

      console.log(`[Signaling] Relayed answer: ${senderPeer.peerId} → ${data.targetPeerId}`)
    })

    // ----- WebRTC Signaling: ICE Candidate -----

    socket.on('signal:ice-candidate', (data: { targetPeerId: string; candidate: any }) => {
      const senderPeer = peerManager.getBySocketId(socket.id)
      if (!senderPeer) return

      const targetSocketId = peerManager.getSocketId(data.targetPeerId)
      if (!targetSocketId) return

      io.to(targetSocketId).emit('signal:ice-candidate-received', {
        peerId: senderPeer.peerId,
        candidate: data.candidate
      })
    })

    // ----- Transfer Request Relay -----

    socket.on('transfer:request-send', (data: { targetPeerId: string; requestId: string; file: any }) => {
      const senderPeer = peerManager.getBySocketId(socket.id)
      if (!senderPeer) return

      const targetSocketId = peerManager.getSocketId(data.targetPeerId)
      if (!targetSocketId) {
        socket.emit('transfer:request-failed', { requestId: data.requestId, reason: 'Peer offline' })
        return
      }

      io.to(targetSocketId).emit('transfer:request-received', {
        requestId: data.requestId,
        peerId: senderPeer.peerId,
        peerName: senderPeer.displayName,
        file: data.file
      })

      console.log(`[Signaling] Transfer request relayed: ${senderPeer.peerId} → ${data.targetPeerId}`)
    })

    // ----- Transfer Request Response -----

    socket.on('transfer:request-respond', (data: { targetPeerId: string; requestId: string; accepted: boolean }) => {
      const senderPeer = peerManager.getBySocketId(socket.id)
      if (!senderPeer) return

      const targetSocketId = peerManager.getSocketId(data.targetPeerId)
      if (!targetSocketId) return

      io.to(targetSocketId).emit('transfer:request-response', {
        requestId: data.requestId,
        peerId: senderPeer.peerId,
        accepted: data.accepted
      })

      console.log(`[Signaling] Transfer response: ${senderPeer.peerId} → ${data.targetPeerId} (${data.accepted ? 'accepted' : 'rejected'})`)
    })

    // ----- Disconnection -----

    socket.on('disconnect', (reason: string) => {
      const peer = peerManager.unregister(socket.id)
      if (peer) {
        socket.broadcast.emit('peer:left', {
          peerId: peer.peerId,
          displayName: peer.displayName
        })
        console.log(`[Signaling] Peer disconnected: ${peer.displayName} (${reason}). Total online: ${peerManager.getCount()}`)
      }
    })

    // ----- Heartbeat -----

    socket.on('ping-alive', () => {
      peerManager.updatePing(socket.id)
    })
  })
}

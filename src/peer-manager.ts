// ===================================================================
// UB-Share — Peer Manager
// In-memory peer registry for the signaling server
// Structured for future Redis adapter support
// ===================================================================

export interface RegisteredPeer {
  socketId: string
  peerId: string
  displayName: string
  sharedFiles: SharedFileEntry[]
  connectedAt: number
  lastPing: number
}

export interface SharedFileEntry {
  fileId: string
  filename: string
  fileSize: number
  mimeType?: string
}

/**
 * In-memory peer manager.
 * Interface designed to be swappable with a Redis-backed implementation.
 */
export class PeerManager {
  // socketId → PeerInfo
  private peers: Map<string, RegisteredPeer> = new Map()
  // peerId → socketId (reverse lookup)
  private peerIdToSocket: Map<string, string> = new Map()

  /**
   * Register a new peer
   */
  register(socketId: string, peerId: string, displayName: string, sharedFiles: SharedFileEntry[] = []): RegisteredPeer {
    const peer: RegisteredPeer = {
      socketId,
      peerId,
      displayName,
      sharedFiles,
      connectedAt: Date.now(),
      lastPing: Date.now()
    }
    this.peers.set(socketId, peer)
    this.peerIdToSocket.set(peerId, socketId)
    console.log(`[PeerManager] Registered peer: ${displayName} (${peerId}) [socket: ${socketId}]`)
    return peer
  }

  /**
   * Unregister a peer by socket ID
   */
  unregister(socketId: string): RegisteredPeer | undefined {
    const peer = this.peers.get(socketId)
    if (peer) {
      this.peers.delete(socketId)
      this.peerIdToSocket.delete(peer.peerId)
      console.log(`[PeerManager] Unregistered peer: ${peer.displayName} (${peer.peerId})`)
    }
    return peer
  }

  /**
   * Get peer by socket ID
   */
  getBySocketId(socketId: string): RegisteredPeer | undefined {
    return this.peers.get(socketId)
  }

  /**
   * Get peer by peer ID
   */
  getByPeerId(peerId: string): RegisteredPeer | undefined {
    const socketId = this.peerIdToSocket.get(peerId)
    if (!socketId) return undefined
    return this.peers.get(socketId)
  }

  /**
   * Get socket ID for a peer ID
   */
  getSocketId(peerId: string): string | undefined {
    return this.peerIdToSocket.get(peerId)
  }

  /**
   * Get all online peers (excluding a specific socket)
   */
  getOnlinePeers(excludeSocketId?: string): RegisteredPeer[] {
    const result: RegisteredPeer[] = []
    for (const [socketId, peer] of this.peers) {
      if (socketId !== excludeSocketId) {
        result.push(peer)
      }
    }
    return result
  }

  /**
   * Get total online peer count
   */
  getCount(): number {
    return this.peers.size
  }

  /**
   * Update a peer's shared files
   */
  updateSharedFiles(socketId: string, sharedFiles: SharedFileEntry[]): void {
    const peer = this.peers.get(socketId)
    if (peer) {
      peer.sharedFiles = sharedFiles
      peer.lastPing = Date.now()
    }
  }

  /**
   * Update last ping time
   */
  updatePing(socketId: string): void {
    const peer = this.peers.get(socketId)
    if (peer) {
      peer.lastPing = Date.now()
    }
  }

  /**
   * Check if a peer ID is online
   */
  isOnline(peerId: string): boolean {
    return this.peerIdToSocket.has(peerId)
  }
}

// Export singleton
export const peerManager = new PeerManager()

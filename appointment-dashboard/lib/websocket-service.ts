// WebSocket service for handling real-time communication
export type WebSocketMessage = {
  type: string;
  payload: any;
  timestamp?: string;
  sender?: string;
  room_id?: string;
};

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

const socketURL =
  process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "echo.websocket.org";

// Connection pool to manage multiple WebSocket instances
class WebSocketConnectionPool {
  private static instance: WebSocketConnectionPool;
  private connections: Map<string, WebSocketService> = new Map();
  private maxConnections = 10;

  static getInstance(): WebSocketConnectionPool {
    if (!WebSocketConnectionPool.instance) {
      WebSocketConnectionPool.instance = new WebSocketConnectionPool();
    }
    return WebSocketConnectionPool.instance;
  }

  getConnection(roomId: string | undefined, agentId: string | undefined, agentName: string | undefined): WebSocketService {
    const safeRoomId = roomId || '';
    const safeAgentId = agentId || '';
    const safeAgentName = agentName || '';
    const key = `${safeRoomId}-${safeAgentId}`;
    
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    // Clean up old connections if pool is full
    if (this.connections.size >= this.maxConnections) {
      const oldestKey = this.connections.keys().next().value;
      const oldestConnection = this.connections.get(oldestKey as string);
      if (oldestConnection) { 
        oldestConnection.disconnect();
        this.connections.delete(oldestKey as string || '');
      }
    }

    const connection = new WebSocketService(safeRoomId, safeAgentId, safeAgentName);
    this.connections.set(key, connection);
    return connection;
  }

  removeConnection(roomId: string | undefined, agentId: string | undefined): void {
    const safeRoomId = roomId || '';
    const safeAgentId = agentId || '';
    const key = `${safeRoomId}-${safeAgentId}`;
    const connection = this.connections.get(key);
    if (connection) {
      connection.disconnect();
      this.connections.delete(key);
    }
  }

  cleanup(): void {
    this.connections.forEach((connection) => {
      connection.disconnect();
    });
    this.connections.clear();
  }
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private roomId: string;
  private agentId: string;
  private agentName: string;
  private manuallyDisconnected = false;
  private maximizing = false;
  private messageQueue: any[] = [];
  private hasConnectedOnce = false;
  private isDestroyed = false;
  private connectionPool: WebSocketConnectionPool;

  private persistQueue() {
    if (this.isDestroyed) return;
    
    try {
      localStorage.setItem(
        "ws_message_queue",
        JSON.stringify(this.messageQueue)
      );
    } catch (e) {
      console.error("Failed to persist message queue", e);
    }
  }

  private loadQueue() {
    if (this.isDestroyed) return;
    
    try {
      const data = localStorage.getItem("ws_message_queue");
      this.messageQueue = data ? JSON.parse(data) : [];
    } catch (e) {
      this.messageQueue = [];
    }
  }

  constructor(roomId: string, agentId: string, agentName: string) {
    this.roomId = roomId;
    this.agentId = agentId;
    this.agentName = agentName;
    this.url = `wss://${socketURL}/ws/agent/${roomId}`;
    this.connectionPool = WebSocketConnectionPool.getInstance();
    this.loadQueue();
    this.hasConnectedOnce = false;
    this.manuallyDisconnected = false;
    this.isDestroyed = false;
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public connect(maximizing: boolean = false): void {
    if (this.isDestroyed) return;
    
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log("WebSocket already connected or connecting");
      return;
    }
    
    this.manuallyDisconnected = false;
    this.maximizing = maximizing;
    this.notifyStatusChange("connecting");

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.notifyStatusChange("error");
      this.attemptReconnect();
    }
  }

  public disconnect(minimizing: boolean = false, manual: boolean = false): void {
    if (this.isDestroyed) return;
    
    this.manuallyDisconnected = manual;
    
    if (this.socket) {
      if (!minimizing && manual) { // Only send message if manual
        const con = {
          content: `${this.agentName || "Live agent"} left the chat.`,
          sender: "system",
        };
        this.socket.send(JSON.stringify(con));
      }
      this.socket.close();
      this.socket = null;
      this.maximizing = false;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
    this.notifyStatusChange("disconnected");
    
    // Remove from connection pool
    this.connectionPool.removeConnection(this.roomId, this.agentId);
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.messageListeners = [];
    this.statusListeners = [];
    this.messageQueue = [];
  }

  public sendMessage(content: string): void {
    if (this.isDestroyed) return;
    
    const id = this.generateMessageId();
    const con = { id, name: this.agentName, content };
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(con));
    } else {
      this.messageQueue.push(con);
      this.persistQueue();
      console.warn("WebSocket not connected, message queued");
    }
  }

  public sendTypingStatus(isTyping: boolean): void {
    if (this.isDestroyed || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WebSocketMessage = {
      type: isTyping ? "agent_typing_start" : "agent_typing_end",
      payload: {
        agent_id: this.agentId,
        agent_name: this.agentName,
      },
      room_id: this.roomId,
    };

    // this.socket.send(JSON.stringify(message))
  }

  public addMessageListener(
    listener: (message: WebSocketMessage) => void
  ): () => void {
    if (this.isDestroyed) return () => {};
    
    this.messageListeners.push(listener);
    return () => {
      if (!this.isDestroyed) {
        this.messageListeners = this.messageListeners.filter(
          (l) => l !== listener
        );
      }
    };
  }

  public addStatusListener(
    listener: (status: ConnectionStatus) => void
  ): () => void {
    if (this.isDestroyed) return () => {};
    
    this.statusListeners.push(listener);
    
    // Immediately notify the new listener of the current status
    if (this.socket) {
      switch (this.socket.readyState) {
        case WebSocket.CONNECTING:
          listener("connecting");
          break;
        case WebSocket.OPEN:
          listener("connected");
          break;
        case WebSocket.CLOSING:
        case WebSocket.CLOSED:
          listener("disconnected");
          break;
      }
    } else {
      listener("disconnected");
    }

    return () => {
      if (!this.isDestroyed) {
        this.statusListeners = this.statusListeners.filter((l) => l !== listener);
      }
    };
  }

  private handleOpen(event: Event): void {
    if (this.isDestroyed) return;
    
    console.log("WebSocket connected");
    this.reconnectAttempts = 0;
    this.notifyStatusChange("connected");
    this.flushQueue();
    
    if (!this.maximizing && !this.hasConnectedOnce && !this.manuallyDisconnected) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const con = {
          content: `${this.agentName || "A live agent"} has joined the chat`,
          sender: "system",
        };
        this.socket.send(JSON.stringify(con));
      }
    }
    this.hasConnectedOnce = true;
  }

  private handleMessage(event: MessageEvent): void {
    if (this.isDestroyed) return;
    
    try {
      // First try to parse as JSON
      const message = JSON.parse(event.data) as WebSocketMessage;
      this.notifyMessageReceived(message);
    } catch (error) {
      // If JSON parsing fails, treat as plain text message
      console.log("Received plain text message:", event.data);

      // Create a WebSocketMessage object for plain text
      const textMessage: WebSocketMessage = {
        type: "system_message",
        payload: {
          content: event.data,
          is_system: true,
        },
        room_id: this.roomId,
        timestamp: new Date().toISOString(),
      };

      this.notifyMessageReceived(textMessage);
    }
  }

  private handleClose(event: CloseEvent): void {
    if (this.isDestroyed) return;
    
    console.log("WebSocket disconnected:", event.code, event.reason);
    this.notifyStatusChange("disconnected");
    
    if (!this.manuallyDisconnected) {
      this.attemptReconnect();
    }
  }

  private handleError(event: Event): void {
    if (this.isDestroyed) return;
    
    console.error("WebSocket error:", event);
    this.notifyStatusChange("error");
    // The close handler will be called after the error
  }

  private attemptReconnect(): void {
    if (this.isDestroyed || this.manuallyDisconnected) {
      console.log("Manual disconnect or destroyed: will not attempt to reconnect.");
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnect attempts reached");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${
        this.reconnectAttempts + 1
      }/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isDestroyed) {
        this.reconnectAttempts++;
        this.connect();
      }
    }, delay);
  }

  private flushQueue() {
    if (
      this.isDestroyed ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN ||
      this.messageQueue.length === 0
    ) {
      return;
    }
    
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this.socket.send(JSON.stringify(msg));
    }
    this.persistQueue();
  }

  private notifyMessageReceived(message: WebSocketMessage): void {
    if (this.isDestroyed) return;
    
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error("Error in message listener:", error);
      }
    });
  }

  private notifyStatusChange(status: ConnectionStatus): void {
    if (this.isDestroyed) return;
    
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Error in status listener:", error);
      }
    });
  }

  public getStatus(): ConnectionStatus {
    if (this.isDestroyed || !this.socket) return "disconnected";

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return "disconnected";
    }
  }
}

// Improved singleton pattern with connection pooling
let websocketInstance: WebSocketService | null = null;

export const getWebSocketService = (
  roomId: string | undefined = "",
  agentId: string | undefined = "",
  agentName: string | undefined = ""
): WebSocketService => {
  const connectionPool = WebSocketConnectionPool.getInstance();
  return connectionPool.getConnection(roomId, agentId, agentName);
};

export const resetWebSocketService = (): void => {
  const connectionPool = WebSocketConnectionPool.getInstance();
  connectionPool.cleanup();
  websocketInstance = null;
};

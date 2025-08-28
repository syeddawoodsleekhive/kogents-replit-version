import { io, Socket } from "socket.io-client";

interface SocketConfig {
  workspaceId: string;
  agentId: string;
  token: string;
}

class SocketSingleton {
  private static instance: SocketSingleton;
  private socket: Socket | null = null;
  private isConnecting = false;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private currentConfig: SocketConfig | null = null;

  private constructor() {}

  static getInstance(): SocketSingleton {
    if (!SocketSingleton.instance) {
      SocketSingleton.instance = new SocketSingleton();
    }
    return SocketSingleton.instance;
  }

  connect(config: SocketConfig): Socket | null {
    if (
      this.socket?.connected &&
      this.currentConfig &&
      this.currentConfig.workspaceId === config.workspaceId &&
      this.currentConfig.agentId === config.agentId
    ) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    const socketURL = process.env.NEXT_PUBLIC_NEW_SOCKET_URL || "";
    const token = config.token;

    if (!socketURL || !token) {
      console.warn("Socket URL or token not available");
      console.warn("Socket URL:", socketURL);
      console.warn("Token:", token);
      return null;
    }

    if (
      this.socket &&
      this.currentConfig &&
      (this.currentConfig.workspaceId !== config.workspaceId ||
        this.currentConfig.agentId !== config.agentId)
    ) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    this.currentConfig = config;

    try {
      this.socket = io(socketURL, {
        transports: ["websocket", "polling"],
        auth: {
          token,
          workspaceId: config.workspaceId,
          agentId: config.agentId,
          userType: "agent",
        },
      });

      this.setupSocketEvents();
      return this.socket;
    } catch (error) {
      console.error("Failed to create socket connection:", error);
      this.isConnecting = false;
      return null;
    }
  }

  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Agent connected to socket server");
      this.isConnecting = false;
      this.emitToListeners("connect", { connected: true });
    });

    this.socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      this.isConnecting = false;
      this.emitToListeners("connect_error", err);
    });

    this.socket.on("disconnect", () => {
      console.log("Agent disconnected");
      this.emitToListeners("disconnect", { connected: false });
    });

    this.setupMessageEvents();
  }

  private setupMessageEvents() {
    if (!this.socket) return;

    this.socket.on("agent-connected", (data) => {
      this.emitToListeners("agent-connected", data);
    });

    this.socket.on("messages-read", (data) => {
      this.emitToListeners("messages-read", data);
    });

    this.socket.on("visitor-queues", (data) => {
      this.emitToListeners("visitor-queues", data);
    });

    this.socket.on("room-details", (data) => {
      this.emitToListeners("room-details", data);
    });

    this.socket.on("new-message", (data) => {
      this.emitToListeners("new-message", data);
    });

    this.socket.on("typing-indicator", (data) => {
      this.emitToListeners("typing-indicator", data);
    });

    this.socket.on("agent-joined-room", (data) => {
      this.emitToListeners("agent-joined-room", data);
    });

    this.socket.on("agent-left-room", (data) => {
      this.emitToListeners("agent-left-room", data);
    });

    this.socket.on("visitor-page-changed", (data) => {
      this.emitToListeners("visitor-page-changed", data);
    });

    this.socket.on("participant-disconnected", (data) => {
      this.emitToListeners("participant-disconnected", data);
    });

    this.socket.on("server-time", (data: { timestamp: number }) => {
      this.emitToListeners("server-time", data);
    });
  }

  private emitToListeners(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(data));
    }
  }

  addEventListener(event: string, listener: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  removeEventListener(event: string, listener: (data: any) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentConfig = null;
    this.eventListeners.clear();
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get socketInstance(): Socket | null {
    return this.socket;
  }

  get config(): SocketConfig | null {
    return this.currentConfig;
  }

  setupDefaultEventHandlers(handlers: {
    handleAgentConnected: (data: any) => void;
    handleNewMessage: (data: any) => void;
    handleTypingStart: (roomId: string, sender: "visitor" | "agent") => void;
    handleTypingStop: (roomId: string) => void;
    handleRoomDetails: (data: any) => void;
    handleVisitorQueues: (data: any) => void;
    handleMessageAck: (data: any) => void;
    handleMessageDelivered: (data: any) => void;
    handleMessagesRead: (data: any) => void;

    handleTypingIndicator: (data: any) => void;
    handleAgentJoinedRoom: (data: any) => void;
    handleAgentLeftRoom: (data: any) => void;
    handleVisitorLeftRoom: (data: any) => void;
    handleVisitorPageChanged: (data: any) => void;
    handleServerTime: (data: { time: number }) => void;
    handleTagAssignedToChat?: (
      data: TagAssignedToChatActionPayloadType
    ) => void;
    handleTagUnassignedFromChat?: (
      data: TagUnassignedFromChatActionPayloadType
    ) => void;
  }) {
    if (!this.socket) return;

    this.socket.off("agent-connected");
    this.socket.off("new-message");
    this.socket.off("client-typing");
    this.socket.off("agent-typing");
    this.socket.off("room-details");
    this.socket.off("visitor-queues");
    this.socket.off("message-ack");
    this.socket.off("delivered-to");
    this.socket.off("messages-read");
    this.socket.off("typing-indicator");
    this.socket.off("agent-joined-room");
    this.socket.off("agent-left-room");
    this.socket.off("visitor-page-changed");
    this.socket.off("participant-disconnected");
    this.socket.off("server-time");
    this.socket.off("tag-assigned-to-chat");
    this.socket.off("tag-unassigned-from-chat");

    this.socket.on("agent-connected", (data: any) => {
      handlers.handleAgentConnected(data);
      this.socket?.emit("get-server-time", {});
    });

    this.socket.on("new-message", (data: any) => {
      if (data.senderType === "visitor") {
        this.socket?.emit("message-delivered", {
          messages: [
            {
              messageId: data.messageId,
              senderId: data.senderId,
            },
          ],
          roomId: data.roomId,
        });
      }
      handlers.handleNewMessage(data);
    });

    this.socket.on("message-ack", (data: any) => {
      handlers.handleMessageAck(data);
    });

    this.socket.on("delivered-to", (data: any) => {
      handlers.handleMessageDelivered(data);
    });

    this.socket.on("messages-read", (data: any) => {
      handlers.handleMessagesRead(data);
    });

    this.socket.on("client-typing", (data: any) => {
      const { roomId, isTyping } = data;
      if (isTyping) {
        handlers.handleTypingStart(roomId, "visitor");
      } else {
        handlers.handleTypingStop(roomId);
      }
    });

    this.socket.on("agent-typing", (data: any) => {
      const { roomId, isTyping } = data;
      if (isTyping) {
        handlers.handleTypingStart(roomId, "agent");
      } else {
        handlers.handleTypingStop(roomId);
      }
    });

    this.socket.on("room-details", (data: any) => {
      handlers.handleRoomDetails(data);
    });

    this.socket.on("visitor-queues", (data: any) => {
      handlers.handleVisitorQueues(data);
    });

    this.socket.on("typing-indicator", (data: any) => {
      handlers.handleTypingIndicator(data);
    });

    this.socket.on("agent-joined-room", (data: any) => {
      handlers.handleAgentJoinedRoom(data);
    });

    this.socket.on("agent-left-room", (data: any) => {
      handlers.handleAgentLeftRoom(data);
    });

    this.socket.on("visitor-page-changed", (data: any) => {
      handlers.handleVisitorPageChanged(data);
    });

    this.socket.on("participant-disconnected", (data: any) => {
      handlers.handleVisitorLeftRoom(data);
    });

    this.socket.on("server-time", (data: { time: number }) => {
      handlers.handleServerTime(data);
    });

    if (handlers.handleTagAssignedToChat) {
      this.socket.on("tag-assigned-to-chat", handlers.handleTagAssignedToChat);
    }

    if (handlers.handleTagUnassignedFromChat) {
      this.socket.on(
        "tag-unassigned-from-chat",
        handlers.handleTagUnassignedFromChat
      );
    }
  }

  cleanup() {
    if (!this.socket) return;

    this.socket.off("tag-assigned-to-chat");
    this.socket.off("tag-unassigned-from-chat");
  }
}

export const socketSingleton = SocketSingleton.getInstance();

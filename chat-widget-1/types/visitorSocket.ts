export interface VisitorConnectedPayload {
  visitorId: string;
  room: string;
  departmentId?: string;
  sessionId: string;
  connectedAt: string | Date;
}

export interface MessageAckPayload {
  roomId: string;
  messageId: string;
  status: string;
  sender: string;
  senderId: string;
  timestamp: string | Date;
  error?: string;
}

export interface NewMessagePayload {
  messageId: string;
  roomId: string;
  content: string;
  senderId: string;
  senderType: string;
  timestamp: string | Date;
  workspaceId: string;
}

export interface ParticipantDisconnectedPayload {
  roomId: string;
  participantId: string;
  participantType: string;
  disconnectedAt: string | Date;
}

export interface VisitorDisconnectedPayload {
  visitorId: string;
  workspaceId: string;
  roomId: string;
  disconnectedAt: string | Date;
}

export interface ReadReceiptAckPayload {
  roomId: string;
  messageIds: string[];
  readerId: string;
  readerType: string;
  timestamp: string | Date;
}

export interface MessagesReadPayload {
  roomId: string;
  messageIds: string[];
  readerId: string;
  readerType: string;
  timestamp: string | Date;
}

export interface ErrorPayload {
  type: string;
  message: string;
  code: string;
  timestamp: string | Date;
  details?: any;
}

export interface MessageRead {
  messageId: string;
  senderId: string;
}

export interface MessageReadRequest {
  roomId: string;
  messages: MessageRead[];
}

// --- Hook Props ---

export interface UseVisitorChatSocketProps {
  sessionId: string;
  workspaceId: string;
  departmentId?: string;
  visitorId: string;
  // onMessageAck?: (data: MessageAckPayload) => void;
  // onNewMessage?: (data: NewMessagePayload) => void;
  // onParticipantDisconnected?: (data: ParticipantDisconnectedPayload) => void;
  // onVisitorDisconnected?: (data: VisitorDisconnectedPayload) => void;
  // onTypingIndicator?: (data: TypingIndicatorPayload) => void;
  // onReadReceiptAck?: (data: ReadReceiptAckPayload) => void;
  // onMessagesRead?: (data: MessagesReadPayload) => void;
  // onError?: (data: ErrorPayload) => void;
}

// --- Emit Payload Types ---

export interface SendMessagePayload {
  messageId: string;
  message: string;
  isEncrypted?: boolean;
  encryptedData?: {
    encryptedContent: string;
    metadata: any;
    messageType: string;
    originalLength: number;
  };
}

export interface SendTypingPayload {
  isTyping: boolean;
}

export interface SendReadReceiptPayload {
  roomId: string;
  messages: MessageRead[];
}

export interface SendMessageDeliveredPayload {
  messageId: string;
  roomId: string;
}

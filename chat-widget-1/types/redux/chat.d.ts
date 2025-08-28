import {
  ADD_MESSAGE,
  MESSAGE_DELIVERED,
  MESSAGE_DELIVERED_TO_SERVER,
  MESSAGE_READ,
  REMOVE_SESSION_ID,
  SET_ALL_MESSAGES,
  SET_SESSION_ID,
} from "@/app/api/v2/chat";

declare global {
  interface MessageHistoryType {
    messages: MessagesType[];
  }

  interface AttachmentType {
    fileName: string;
    mimeType: string;
    size: number;
    previewUrl: string;
    url: string;
    isBase64?: boolean;
  }

  interface MessagesType {
    id?: string;
    roomId: string;
    senderId: string;
    senderName?: string;
    senderType:
      | "visitor"
      | "agent"
      | "ai-agent"
      | "visitor-system"
      | "agent-system";
    messageId: string;
    content: string;
    messageType: "text" | "audio" | "file";
    replyToId?: string;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt?: Date;
    metadata?: {
      attachment?: AttachmentType;
    };
    attachment?: AttachmentType;
    user?: { name: string };
    userId?: string;
    sentAt?: Date;
    isEncrypted?: boolean;
    encryptedData?: {
      encryptedContent: string;
      metadata: any;
      messageType: string;
      originalLength: number;
    };
  }
  interface ChatReducerStateType {
    sessionId: string;
    sessionToken: string;
    messages: MessagesType[];
    isAgentTyping?: TypingIndicatorPayload;
  }

  interface SetSessionIdActionType {
    type: typeof SET_SESSION_ID;
    payload: { sessionId: string; sessionToken: string };
  }

  interface SetAllMessagesActionType {
    type: typeof SET_ALL_MESSAGES;
    payload: MessagesType[];
  }

  interface AddMessageActionType {
    type: typeof ADD_MESSAGE;
    payload: MessagesType;
  }

  interface SetMessageDeliveredActionType {
    type: typeof MESSAGE_DELIVERED;
    payload: string;
  }

  interface SetMessageDeliveredToServerActionType {
    type: typeof MESSAGE_DELIVERED_TO_SERVER;
    payload: string;
  }

  interface SetMessageReadActionType {
    type: typeof MESSAGE_READ;
    payload: {
      messageIds: string[];
      readAt?: string;
    };
  }

  interface MessageReadEvent {
    roomId: string;
    messageIds: string[];
    readAt: string;
  }

  interface SetAgentTypingActionType {
    type: typeof SET_AGENT_TYPING;
    payload: TypingIndicatorPayload | undefined;
  }

  interface RemoveSessionIdActionType {
    type: typeof REMOVE_SESSION_ID;
    payload: any;
  }

  interface UpdateMessageActionType {
    type: typeof UPDATE_MESSAGE;
    payload: {
      messageId: string;
      updates: Partial<MessagesType>;
    };
  }

  type ChatReducerActionsType =
    | SetSessionIdActionType
    | SetAllMessagesActionType
    | AddMessageActionType
    | SetMessageDeliveredActionType
    | SetMessageDeliveredToServerActionType
    | SetMessageReadActionType
    | SetAgentTypingActionType
    | RemoveSessionIdActionType
    | UpdateMessageActionType;
}

export default global;

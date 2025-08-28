import {
  ADD_MESSAGE,
  MESSAGE_DELIVERED,
  MESSAGE_DELIVERED_TO_SERVER,
  MESSAGE_READ,
  REMOVE_SESSION_ID,
  SET_AGENT_TYPING,
  SET_ALL_MESSAGES,
  SET_SESSION_ID,
  UPDATE_MESSAGE,
} from "@/app/api/v2/chat";
import { getSessionId } from "@/functions";

const initialState: ChatReducerStateType = {
  sessionId: getSessionId() || "",
  sessionToken: getSessionId() || "",
  messages: [],
  isAgentTyping: undefined,
};

export const chatReducer = (
  state: ChatReducerStateType = initialState,
  action: ChatReducerActionsType
) => {
  switch (action.type) {
    case SET_SESSION_ID:
      const data = action.payload;
      if (typeof window === "undefined" || !data.sessionId) return;
      const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString();
      document.cookie = `sessionId=${data.sessionId}; expires=${expires}; path=/; SameSite=Lax`;
      document.cookie = `sessionToken=${data.sessionToken}; expires=${expires}; path=/; SameSite=Lax`;
      window.localStorage.setItem(
        "kogents_session",
        JSON.stringify({
          id: data.sessionId,
          token: data.sessionToken,
          expires: Date.now() + 2 * 60 * 60 * 1000,
        })
      );
      return {
        ...state,
        sessionId: data.sessionId,
        sessionToken: data.sessionToken,
      };
    case SET_ALL_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    case ADD_MESSAGE:
      const isVisitorMessage = action.payload.senderType === "visitor";
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            ...action.payload,
            ...(!isVisitorMessage ? { deliveredAt: new Date() } : {}),
          },
        ],
      };
    case MESSAGE_DELIVERED_TO_SERVER:
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === action.payload
            ? { ...msg, createdAt: new Date() }
            : msg
        ),
      };
    case MESSAGE_DELIVERED:
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === action.payload
            ? { ...msg, deliveredAt: new Date() }
            : msg
        ),
      };
    case MESSAGE_READ:
      return {
        ...state,
        messages: state.messages.map((msg) =>
          action.payload.messageIds.includes(msg.messageId)
            ? {
                ...msg,
                readAt: action.payload.readAt
                  ? new Date(action.payload.readAt)
                  : new Date(),
              }
            : msg
        ),
      };

    case UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.messageId === action.payload.messageId
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };

    case SET_AGENT_TYPING:
      return {
        ...state,
        isAgentTyping: action.payload,
      };
    case REMOVE_SESSION_ID:
      document.cookie = `sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      document.cookie = `sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      window.localStorage.removeItem("kogents_session");
      return {
        ...state,
        sessionId: "",
        sessionToken: "",
        messages: [],
      };
    default:
      return state;
  }
};

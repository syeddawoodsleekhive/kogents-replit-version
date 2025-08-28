import Axios from "@/lib/axios";
import {
  getDeviceFingerprint,
  getDeviceInfo,
  getGeoInfo,
  getPageTrackingData,
  getParentPageInfo,
  getReferrerInfo,
  getVisitorId,
} from "./functions";

export const SET_SESSION_ID = "SET_SESSION_ID";
export const REMOVE_SESSION_ID = "REMOVE_SESSION_ID";
export const SET_ALL_MESSAGES = "SET_ALL_MESSAGES";
export const ADD_MESSAGE = "ADD_MESSAGE";
export const MESSAGE_DELIVERED = "MESSAGE_DELIVERED";
export const MESSAGE_DELIVERED_TO_SERVER = "MESSAGE_DELIVERED_TO_SERVER";
export const MESSAGE_READ = "MESSAGE_READ";
export const SET_AGENT_TYPING = "SET_AGENT_TYPING";
export const UPDATE_MESSAGE = "UPDATE_MESSAGE";

export const setSessionId = ({
  sessionId,
  sessionToken,
}: {
  sessionId: string;
  sessionToken: string;
}): SetSessionIdActionType => ({
  type: SET_SESSION_ID,
  payload: { sessionId, sessionToken },
});

export const setAllMessages = (
  messages: MessagesType[]
): SetAllMessagesActionType => ({
  type: SET_ALL_MESSAGES,
  payload: messages,
});

export const setAddMessage = (message: MessagesType): AddMessageActionType => ({
  type: ADD_MESSAGE,
  payload: message,
});

export const setMessageDeliveredToServer = (
  messageId: string
): SetMessageDeliveredToServerActionType => ({
  type: MESSAGE_DELIVERED_TO_SERVER,
  payload: messageId,
});

export const setMessageDelivered = (
  messageId: string
): SetMessageDeliveredActionType => ({
  type: MESSAGE_DELIVERED,
  payload: messageId,
});

export const setMessageRead = (
  messageIds: string[],
  readAt?: string
): SetMessageReadActionType => ({
  type: MESSAGE_READ,
  payload: { messageIds, readAt },
});

export const setAgentTyping = (
  typingIndicator: TypingIndicatorPayload | undefined
): SetAgentTypingActionType => ({
  type: SET_AGENT_TYPING,
  payload: typingIndicator,
});

export const removeSessionId = (): RemoveSessionIdActionType => ({
  type: REMOVE_SESSION_ID,
  payload: null,
});

export const updateMessage = (
  messageId: string,
  updates: Partial<MessagesType>
): UpdateMessageActionType => ({
  type: UPDATE_MESSAGE,
  payload: { messageId, updates },
});

export const createSessionId = (
  workspaceId: string,
  callBack?: callbackType,
  onError?: onErrorType
) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      const deviceFingerprint = await getDeviceFingerprint();
      const locationData = await getGeoInfo();
      const deviceInfo = await getDeviceInfo();
      const pageTracking = getPageTrackingData();
      const visitorId = getVisitorId();
      const referrerData = getReferrerInfo();

      const data: createSessionIdDataType = {
        userAgent: navigator.userAgent,
        pageTracking,
        referrerData,
        visitor_id: visitorId,
        workspaceId,
        deviceFingerprint,
        ipAddress: deviceFingerprint?.webrtc?.publicIP ?? "",
        location: locationData,
        hostName: locationData?.org ?? "",
        deviceInfo: deviceInfo,
      };

      const res = await Axios.post("/visitors/session", data);
      const response: createSessionIdResponseType = res.data;

      if (response) {
        dispatch(
          setSessionId({
            sessionId: response.sessionId,
            sessionToken: response.sessionId,
          })
        );
        callBack?.();
      }
    } catch (err: any) {
      console.error(err);
      onError?.(err.message || "Unknown error");
    }
  };
};

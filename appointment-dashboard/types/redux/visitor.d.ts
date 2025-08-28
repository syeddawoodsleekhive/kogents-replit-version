import { SET_VISITOR_QUEUE } from "@/api/v2/visitor";
import { TAG_ASSIGNED_TO_CHAT, TAG_UNASSIGNED_FROM_CHAT } from "@/api/v2/chat";

declare global {
  interface VisitorReducerStateType {
    active: visitorSessionDataType[];
    idle: visitorSessionDataType[];
    incoming: visitorSessionDataType[];
    currentlyServed: visitorSessionDataType[];
    pendingTransfer: visitorSessionDataType[];
    pendingInvite: visitorSessionDataType[];
    loading: boolean;
  }

  interface SetVisitorQueueActionType {
    type: typeof SET_VISITOR_QUEUE;
    payload: VisitorReducerStateType;
  }

  type VisitorReducerActionsType =
    | SetVisitorQueueActionType
    | TagAssignedToChatActionType
    | TagUnassignedFromChatActionType;
}

export default global;

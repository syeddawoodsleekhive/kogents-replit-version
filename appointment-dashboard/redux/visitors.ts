import { SET_VISITOR_QUEUE } from "@/api/v2/visitor";
import { TAG_ASSIGNED_TO_CHAT, TAG_UNASSIGNED_FROM_CHAT } from "@/api/v2/chat";

const initialState: VisitorReducerStateType = {
  active: [],
  idle: [],
  incoming: [],
  currentlyServed: [],
  pendingInvite: [],
  pendingTransfer: [],
  loading: true,
};

export const visitorReducer = (
  state: VisitorReducerStateType = initialState,
  action: VisitorReducerActionsType
) => {
  switch (action.type) {
    case SET_VISITOR_QUEUE:
      return { ...state, ...action.payload, loading: false };

    case TAG_ASSIGNED_TO_CHAT:
      const { roomId, tag, tags } = action.payload;
      let tagsToAdd: Tag[] = [];

      if (tag) {
        tagsToAdd.push(tag);
      } else if (tags && Array.isArray(tags)) {
        tagsToAdd = tags;
      }

      if (tagsToAdd.length > 0) {
        return {
          ...state,
          active: state.active.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
          idle: state.idle.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
          incoming: state.incoming.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
          currentlyServed: state.currentlyServed.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
          pendingInvite: state.pendingInvite.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
          pendingTransfer: state.pendingTransfer.map((visitor) =>
            visitor.roomId === roomId
              ? { ...visitor, tags: [...(visitor.tags || []), ...tagsToAdd] }
              : visitor
          ),
        };
      }
      return state;

    case TAG_UNASSIGNED_FROM_CHAT:
      const {
        roomId: unassignRoomId,
        tag: unassignTag,
        tags: unassignTags,
      } = action.payload;
      let tagsToRemove: Tag[] = [];

      if (unassignTag) {
        tagsToRemove.push(unassignTag);
      } else if (unassignTags && Array.isArray(unassignTags)) {
        tagsToRemove = unassignTags;
      }

      if (tagsToRemove.length > 0) {
        const tagIdsToRemove = new Set(tagsToRemove.map((t) => t.id));
        return {
          ...state,
          active: state.active.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
          idle: state.idle.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
          incoming: state.incoming.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
          currentlyServed: state.currentlyServed.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
          pendingInvite: state.pendingInvite.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
          pendingTransfer: state.pendingTransfer.map((visitor) =>
            visitor.roomId === unassignRoomId
              ? {
                  ...visitor,
                  tags: (visitor.tags || []).filter(
                    (t) => !tagIdsToRemove.has(t.id)
                  ),
                }
              : visitor
          ),
        };
      }
      return state;

    default:
      return state;
  }
};

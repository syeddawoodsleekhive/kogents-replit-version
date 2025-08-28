export const SET_VISITOR_QUEUE = "SET_VISITOR_QUEUE";

export const setVisitorQueue = (
  payload: VisitorReducerStateType
): SetVisitorQueueActionType => ({
  type: SET_VISITOR_QUEUE,
  payload,
});

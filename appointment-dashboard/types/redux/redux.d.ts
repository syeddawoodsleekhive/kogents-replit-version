import { ThunkDispatch } from "redux-thunk";

declare global {
  interface RootReducerState {
    visitors: VisitorReducerStateType;
    chat: ChatReducerStateType;
    user: UserReducerStateType;
    cannedResponses: CannedResponsesState;
    tags: TagsReducerStateType;
  }

  type ReducerActionsType =
    | VisitorReducerActionsType
    | ChatReducerActionsType
    | UserReducerActionsType
    | CannedResponsesActionTypes
    | TagsActionTypes;

  type AppReducerDispatch = ThunkDispatch<
    RootState,
    unknown,
    ReducerActionsType
  >;
}

export default global;

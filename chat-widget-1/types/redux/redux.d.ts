import { ThunkDispatch } from "redux-thunk";

declare global {
  interface RootReducerState {
    chat: ChatReducerStateType;
  }

  type ReducerActionsType = ChatReducerActionsType;

  type AppReducerDispatch = ThunkDispatch<
    RootState,
    unknown,
    ReducerActionsType
  >;
}

export default global;

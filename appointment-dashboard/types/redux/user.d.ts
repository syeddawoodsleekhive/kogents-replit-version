import {
  SET_USER,
  SET_TOKEN,
  SET_WORKSPACE,
  CLEAR_USER,
  SET_LOADING,
} from "@/api/v2/user";

declare global {
  interface UserType {
    id: string;
    name: string;
    email: string;
    workspaceId: string;
    role: {
      id: string;
      name: string;
    };
  }

  interface WorkspaceType {
    id: string;
    name: string;
    slug: string;
  }

  interface UserReducerStateType {
    token: string;
    user: UserType | null;
    workspace: WorkspaceType | null;
    loading: boolean;
  }

  // User Actions
  interface SetUserActionType {
    type: typeof SET_USER;
    payload: UserType;
  }

  interface SetTokenActionType {
    type: typeof SET_TOKEN;
    payload: string;
  }

  interface SetWorkspaceActionType {
    type: typeof SET_WORKSPACE;
    payload: WorkspaceType;
  }

  interface ClearUserActionType {
    type: typeof CLEAR_USER;
  }

  interface SetLoadingActionType {
    type: typeof SET_LOADING;
    payload: boolean;
  }

  type UserReducerActionsType =
    | SetUserActionType
    | SetTokenActionType
    | SetWorkspaceActionType
    | ClearUserActionType
    | SetLoadingActionType;
}

export default global;

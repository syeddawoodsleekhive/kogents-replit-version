import {
  SET_USER,
  SET_TOKEN,
  SET_WORKSPACE,
  CLEAR_USER,
  SET_LOADING,
} from "@/api/v2/user";
import { getToken } from "@/functions/index-v2";

const initialState: UserReducerStateType = {
  token: getToken(),
  user: null,
  workspace: null,
  loading: false,
};

export const userReducer = (
  state: UserReducerStateType = initialState,
  action: UserReducerActionsType
) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    case SET_TOKEN:
      document.cookie = `token=${action.payload}; path=/; max-age=${
        15 * 60
      }; secure; samesite=strict`;
      return {
        ...state,
        token: action.payload,
      };

    case SET_WORKSPACE:
      return {
        ...state,
        workspace: action.payload,
      };

    case CLEAR_USER:
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return {
        ...state,
        token: "",
        user: null,
        workspace: null,
      };

    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

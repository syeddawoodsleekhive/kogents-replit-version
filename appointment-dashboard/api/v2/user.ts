import { getToken } from "@/functions/index-v2";
import Axios from "@/lib/axios";

export const SET_USER = "SET_USER";
export const SET_TOKEN = "SET_TOKEN";
export const SET_WORKSPACE = "SET_WORKSPACE";
export const CLEAR_USER = "CLEAR_USER";
export const SET_LOADING = "SET_LOADING";

export const setUser = (payload: UserType): SetUserActionType => ({
  type: SET_USER,
  payload,
});

export const setToken = (payload: string): SetTokenActionType => ({
  type: SET_TOKEN,
  payload,
});

export const setWorkspace = (
  payload: WorkspaceType
): SetWorkspaceActionType => ({
  type: SET_WORKSPACE,
  payload,
});

export const clearUser = (): ClearUserActionType => ({
  type: CLEAR_USER,
});

export const setLoading = (payload: boolean): SetLoadingActionType => ({
  type: SET_LOADING,
  payload,
});

export const loginUser = (credentials: { email: string; password: string }) => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setLoading(true));

      const response = await Axios.post("/auth/login", credentials);

      dispatch(setToken(response.data.access_token));
      dispatch(setUser(response.data.user));
      dispatch(setWorkspace(response.data.workspace));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchUserProfile = () => {
  return async (dispatch: AppReducerDispatch) => {
    try {
      dispatch(setLoading(true));

      const token = getToken();
      if (!token) {
        throw new Error("No token available");
      }

      const response = await Axios.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setUser(response.data));
      dispatch(setWorkspace(response.data.workspace));

      return { success: true };
    } catch (error) {
      console.error("Profile fetch error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const logoutUser = () => {
  return (dispatch: AppReducerDispatch) => {
    dispatch(clearUser());
  };
};

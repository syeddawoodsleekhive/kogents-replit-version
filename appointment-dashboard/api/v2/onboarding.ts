import Axios from "@/lib/axios";
import {
  ConfirmationData,
  OrgInfoData,
  Step,
  WorkspaceData,
} from "@/types/onboarding";
import { setToken, setUser, setWorkspace } from "./user";

// Action Types
export const SET_STEP = "SET_STEP";
export const SET_ADMIN_DATA = "SET_ADMIN_DATA";
export const SET_ORG_DATA = "SET_ORG_DATA";
export const SET_WORKSPACE_DATA = "SET_WORKSPACE_DATA";
export const SET_LOADING = "SET_LOADING";
export const SET_SESSION_ID = "SET_SESSION_ID";

// Action Creators
export const setStep = (step: Step) => ({
  type: SET_STEP,
  payload: step,
});

export const setAdminData = (data: any) => ({
  type: SET_ADMIN_DATA,
  payload: data,
});

export const setOrgData = (data: OrgInfoData) => ({
  type: SET_ORG_DATA,
  payload: data,
});

export const setWorkspaceData = (data: WorkspaceData) => ({
  type: SET_WORKSPACE_DATA,
  payload: data,
});

export const setLoading = (loading: boolean) => ({
  type: SET_LOADING,
  payload: loading,
});

export const setSessionId = (sessionId: string | null) => ({
  type: SET_SESSION_ID,
  payload: sessionId,
});

// Thunks
export const adminInfoSubmit = (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  return async (dispatch: any) => {
    try {
      dispatch(setLoading(true));

      const response = await Axios.post("/auth/signup", payload);

      if (response && response.data) {
        const adminData = {
          name: payload.name,
          ...response.data,
        };

        dispatch(setAdminData(adminData));
        dispatch(setSessionId(response.data.sessionId));

        // Store session ID in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("sessionId", response.data.sessionId);
        }

        // Set next step based on response
        if (response.data.step === "org-info") {
          dispatch(setStep("org-info"));
        } else {
          dispatch(setStep("org-info")); // fallback
        }

        return { success: true, data: response.data };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during signup.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const orgInfoSubmit = (data: OrgInfoData) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(setOrgData(data));
      dispatch(setStep("workspace"));

      const state = getState();
      const adminData = state.onboarding.adminData;

      if (adminData) {
        const workspaceData = {
          workspaceEmail: adminData.email,
          workspaceSlug: data.companyName
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-"),
          terms: false,
        };
        dispatch(setWorkspaceData(workspaceData));
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.message || "An error occurred while saving organization info.",
      };
    }
  };
};

export const workspaceSubmit = (data: WorkspaceData) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(setLoading(true));

      const state = getState();
      const adminData = state.onboarding.adminData;
      const orgData = state.onboarding.orgData;
      const sessionId = state.onboarding.sessionId;

      const payload = {
        sessionId: adminData?.sessionId || sessionId,
        name: orgData?.companyName,
        slug: data.workspaceSlug,
        branding: {
          companyName: orgData?.companyName,
          industry: orgData?.industry,
          companySize: orgData?.size,
          country: orgData?.country,
        },
      };

      const response = await Axios.post("/workspace", payload);

      if (response.data) {
        dispatch(setWorkspaceData(data));

        // Set next step based on response
        if (response.data.step === "confirm") {
          dispatch(setStep("confirm"));
        }

        return { success: true, data: response.data };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during workspace creation.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const confirmationSubmit = (data: ConfirmationData) => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(setLoading(true));

      const state = getState();
      const workspaceData = state.onboarding.workspaceData;
      const adminData = state.onboarding.adminData;
      const sessionId = state.onboarding.sessionId;

      if (!workspaceData || !adminData) {
        throw new Error("Missing required data");
      }

      const payload = {
        sessionId: adminData.sessionId || sessionId,
        code: data.code,
      };

      const response = await Axios.post("/auth/verify/confirm-otp", payload);

      if (response.data) {
        // Set token and user data
        dispatch(setToken(response.data.access_token));
        dispatch(setUser(response.data.user));
        dispatch(setWorkspace(response.data.workspace));

        // Set workspace cookie
        document.cookie = `workspace=${response.data.workspace.slug}; max-age=1800; path=/`;

        return { success: true, data: response.data };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during confirmation.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const resendCode = () => {
  return async (dispatch: any, getState: any) => {
    try {
      dispatch(setLoading(true));

      const state = getState();
      const adminData = state.onboarding.adminData;

      const response = await Axios.post("/auth/verify/send-otp", {
        sessionId: adminData?.sessionId,
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred while resending the code.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const signupResume = (sessionId: string) => {
  return async (dispatch: any) => {
    try {
      dispatch(setLoading(true));

      const response = await Axios.post("/auth/resume", {
        sessionId: sessionId,
      });

      if (response.data) {
        // Set admin data
        dispatch(
          setAdminData({
            email: response.data.user.email,
            name: response.data.user.name,
            sessionId: sessionId,
          })
        );

        // Set workspace data
        const workspaceData = {
          workspaceEmail: response.data.user.email,
          workspaceSlug: response.data.workspace.slug,
          terms: false,
        };
        dispatch(setWorkspaceData(workspaceData));

        // Set next step based on response
        if (response.data.step === "org-info") {
          dispatch(setStep("org-info"));
        } else if (response.data.step === "confirm") {
          dispatch(setStep("confirm"));
        }

        return { success: true, data: response.data };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred while resuming signup.",
      };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

import {
  SET_ADMIN_DATA,
  SET_ORG_DATA,
  SET_SESSION_ID,
  SET_STEP,
  SET_WORKSPACE_DATA,
} from "@/api/v2/onboarding";
import { SET_LOADING } from "@/api/v2/user";
import {
  OnboardingReducerActionsType,
  OnboardingReducerStateType,
} from "@/types/redux/onboarding";

// Initial State
const initialState: OnboardingReducerStateType = {
  step: "admin-info",
  adminData: null,
  orgData: null,
  workspaceData: null,
  loading: false,
  sessionId: null,
};

// Reducer
export const onboardingReducer = (
  state: OnboardingReducerStateType = initialState,
  action: OnboardingReducerActionsType
) => {
  switch (action.type) {
    case SET_STEP:
      return {
        ...state,
        step: action.payload,
      };
    case SET_ADMIN_DATA:
      return {
        ...state,
        adminData: action.payload,
      };
    case SET_ORG_DATA:
      return {
        ...state,
        orgData: action.payload,
      };
    case SET_WORKSPACE_DATA:
      return {
        ...state,
        workspaceData: action.payload,
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.payload,
      };
    default:
      return state;
  }
};

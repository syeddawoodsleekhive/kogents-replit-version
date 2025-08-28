import {
  Step,
  AdminInfoData,
  OrgInfoData,
  WorkspaceData,
} from "@/types/onboarding";

// Onboarding State Type
interface OnboardingReducerStateType {
  step: Step;
  adminData: any | null;
  orgData: OrgInfoData | null;
  workspaceData: WorkspaceData | null;
  loading: boolean;
  sessionId: string | null;
}

// Onboarding Action Types
type OnboardingReducerActionsType =
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_ADMIN_DATA"; payload: any }
  | { type: "SET_ORG_DATA"; payload: OrgInfoData }
  | { type: "SET_WORKSPACE_DATA"; payload: WorkspaceData }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SESSION_ID"; payload: string | null };

import { WorkspaceUser, Workspace } from "@/types";

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthContextType {
  user: WorkspaceUser | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: AuthError | null;
  login: (email: string, password: string, workspace: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    workspace: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
}

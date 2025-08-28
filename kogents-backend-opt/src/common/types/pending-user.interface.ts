import { VerificationType } from '../../auth/verify/dtos/send-otp.dto';
import { SignupStep } from '../../auth/dtos/signup-session.dto';

export interface PendingUserData {
  // Core user data (aligns with User model)
  name: string;
  email: string;
  hashedPassword: string;
  phone?: string;
  status?: string; // Will default to "active" in DB
  avatarUrl?: string;

  // These will be set during atomic transaction
  roleId?: string; // Will be set when admin role is created
  workspaceId?: string; // Will be set when workspace is created

  // Workspace data (aligns with Workspace model)
  workspace?: PendingWorkspaceData;

  // Flow tracking
  step: SignupStep;
  createdAt: Date;
  lastUpdated: Date;
  expiresAt: Date;
  sessionId?: string; // Unique session ID for this signup attempt

  // Email verification tracking
  emailVerification?: PendingEmailVerification;
}

export interface PendingWorkspaceData {
  name: string;
  slug: string;
  branding?: any; // JSON field - matches Workspace.branding
  apiToken?: string; // Will be generated during creation
}

export interface PendingEmailVerification {
  otpCode: string;
  verificationType: VerificationType;
  attempts: number;
  lastSentAt: Date;
  expiresAt: Date;
}

export interface SignupResponse {
  step: SignupStep;
  email: string;
  sessionId?: string; // Session ID for tracking this signup attempt
  expiresAt: Date;
}

export interface ResumeSignupResponse {
  step: SignupStep;
  user: {
    name: string;
    email: string;
  };
  workspace?: {
    name: string;
    slug: string;
  };
  timeRemaining: number; // seconds until session expires
} 
import { z } from "zod";

export type Step = "admin-info" | "org-info" | "workspace" | "confirm";

// Step 1: Admin Info Schema
export const adminInfoSchema = z
  .object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminInfoData = z.infer<typeof adminInfoSchema>;

// Step 2: Organization Info Schema
export const orgInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  size: z.string().min(1, "Company size is required"),
  country: z.string().min(1, "Country is required"),
});

export type OrgInfoData = z.infer<typeof orgInfoSchema>;

// Step 3: Workspace Registration Schema
export const workspaceSchema = z.object({
  workspaceEmail: z.string().email("Invalid email format"),
  workspaceSlug: z
    .string()
    .min(3, "Workspace slug must be at least 3 characters")
    .max(30, "Workspace slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Workspace slug can only contain lowercase letters, numbers, and hyphens",
    }),
  terms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type WorkspaceData = z.infer<typeof workspaceSchema>;

// Step 4: Email Confirmation Schema
export const confirmationSchema = z.object({
  code: z
    .string()
    .min(6, "Confirmation code must be 6 digits")
    .max(6, "Confirmation code must be 6 digits"),
});

export type ConfirmationData = z.infer<typeof confirmationSchema>;

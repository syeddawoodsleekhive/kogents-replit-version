"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoleList } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { defaultPermissionsByRole } from "./mock-data";
import type { UserRole } from "./types";
import { useUsers } from "./user-context";
import { useToast } from "@/hooks/use-toast";
// Password strength regex patterns
const PASSWORD_PATTERNS = {
  containsUppercase: /[A-Z]/,
  containsLowercase: /[a-z]/,
  containsNumber: /[0-9]/,
  containsSpecial: /[^A-Za-z0-9]/,
} as const;

// Password generation utilities
const createPasswordUtils = () => {
  const generateRandomPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
    let password = "";

    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_-+=<>?"[Math.floor(Math.random() * 16)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (PASSWORD_PATTERNS.containsUppercase.test(password)) strength += 1;
    if (PASSWORD_PATTERNS.containsLowercase.test(password)) strength += 1;
    if (PASSWORD_PATTERNS.containsNumber.test(password)) strength += 1;
    if (PASSWORD_PATTERNS.containsSpecial.test(password)) strength += 1;

    return strength;
  };

  const getPasswordStrengthText = (strength: number) => {
    const strengthTexts = {
      0: "Very weak",
      1: "Weak",
      2: "Fair",
      3: "Good",
      4: "Strong",
      5: "Very strong",
    };
    return strengthTexts[strength as keyof typeof strengthTexts] || "Very weak";
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-yellow-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthWidth = (strength: number) => {
    const widths = {
      0: "w-[10%]",
      1: "w-[20%]",
      2: "w-[40%]",
      3: "w-[60%]",
      4: "w-[80%]",
      5: "w-full",
    };
    return widths[strength as keyof typeof widths] || "w-[10%]";
  };

  return {
    generateRandomPassword,
    calculatePasswordStrength,
    getPasswordStrengthText,
    getPasswordStrengthColor,
    getPasswordStrengthWidth,
  };
};

// Enhanced form validation schema
const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  role: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"]),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .refine((val) => PASSWORD_PATTERNS.containsUppercase.test(val), {
      message: "Password must contain an uppercase letter",
    })
    .refine((val) => PASSWORD_PATTERNS.containsLowercase.test(val), {
      message: "Password must contain a lowercase letter",
    })
    .refine((val) => PASSWORD_PATTERNS.containsNumber.test(val), {
      message: "Password must contain a number",
    })
    .refine((val) => PASSWORD_PATTERNS.containsSpecial.test(val), {
      message: "Password must contain a special character",
    })
    .optional()
    .or(z.literal("")),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
  roles: RoleList[];
}

// Password field component
const PasswordField: React.FC<{
  field: any;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  passwordStrength: number;
  onGeneratePassword: () => void;
  getPasswordStrengthText: (strength: number) => string;
  getPasswordStrengthColor: (strength: number) => string;
  getPasswordStrengthWidth: (strength: number) => string;
}> = ({
  field,
  showPassword,
  setShowPassword,
  passwordStrength,
  onGeneratePassword,
  getPasswordStrengthText,
  getPasswordStrengthColor,
  getPasswordStrengthWidth,
}) => (
  <FormItem>
    <FormLabel>Password</FormLabel>
    <div className="flex space-x-2">
      <FormControl>
        <div className="relative w-full">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            {...field}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </FormControl>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onGeneratePassword}
            >
              <RefreshCw size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate strong password</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    {/* Password strength indicator */}
    {field.value && (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">Password strength:</span>
          <span className="text-xs font-medium">
            {getPasswordStrengthText(passwordStrength)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${getPasswordStrengthColor(
              passwordStrength
            )} ${getPasswordStrengthWidth(passwordStrength)}`}
          ></div>
        </div>
      </div>
    )}

    <FormMessage />
  </FormItem>
);

export const UserForm: React.FC<UserFormProps> = ({
  userId,
  onSuccess,
  roles,
}) => {
  const { createUser, updateUser, getUserById } = useUsers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();

  // Initialize utilities
  const passwordUtils = createPasswordUtils();

  // Initialize form with default values
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      status: "ACTIVE",
      password: "",
    },
  });

  // Load user data if editing an existing user
  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        setIsLoading(true);
        try {
          const user = getUserById(userId);
          if (user) {
            console.log(user);
            // Reset form with user data
            form.reset({
              name: user.name,
              email: user.email,
              phone: user.phone || "",
              role: user.role,
              status: user.status,
              password: "",
            });
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUserData();
  }, [userId, getUserById, form]);

  // Watch form values
  const watchRole = form.watch("role");
  const watchPassword = form.watch("password");

  // Calculate password strength
  const passwordStrength = passwordUtils.calculatePasswordStrength(
    watchPassword || ""
  );

  useEffect(() => {
    // Only set default permissions if this is a new user
    if (!userId) {
      const rolePermissions = defaultPermissionsByRole[watchRole as UserRole];
      // form.setValue("permissions", rolePermissions);
    }
  }, [watchRole, form, userId]);

  const handleGeneratePassword = () => {
    const password = passwordUtils.generateRandomPassword();
    form.setValue("password", password);
    setShowPassword(true);
  };

  // Use React Hook Form's handleSubmit to get all form values
  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const userData = {
        ...data,
      };
      if (userId) {
        await updateUser(userId, userData);
      } else {
        await createUser(userData);
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.response.data.message || "Error submitting form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading user data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john.doe@example.com"
                      type="email"
                      disabled={userId ? true : false}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(555) 123-4567"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Inactive or suspended users cannot log in.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role: RoleList) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines the user's default permissions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <PasswordField
                  field={field}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  passwordStrength={passwordStrength}
                  onGeneratePassword={handleGeneratePassword}
                  getPasswordStrengthText={
                    passwordUtils.getPasswordStrengthText
                  }
                  getPasswordStrengthColor={
                    passwordUtils.getPasswordStrengthColor
                  }
                  getPasswordStrengthWidth={
                    passwordUtils.getPasswordStrengthWidth
                  }
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {userId ? "Updating..." : "Creating..."}
              </>
            ) : userId ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

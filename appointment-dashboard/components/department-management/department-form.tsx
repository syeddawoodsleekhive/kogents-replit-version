"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentContext } from "./department-context";
import { Loader2, User } from "lucide-react";
import { ColorPicker } from "./color-picker";
import { IconPicker } from "./icon-picker";
import { formatDepartmentPath } from "@/lib/utils/department-utils";

// Form validation schema
const departmentFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  departmentId?: string;
  onSuccess?: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  departmentId,
  onSuccess,
}) => {
  const { departments, createDepartment, updateDepartment, getDepartmentById } =
    useDepartmentContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!departmentId);
  const [availableParents, setAvailableParents] = useState<
    { id: string; name: string; path: string }[]
  >([]);

  // Mock managers for demo purposes
  const managers = [
    { id: "usr_001", name: "John Admin" },
    { id: "usr_002", name: "Sarah Manager" },
    { id: "usr_007", name: "Jessica Roberts" },
  ];

  // Initialize form with default values
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "none", // Updated default value
      managerId: "none", // Updated default value
      color: "#6366f1", // Default indigo color
      icon: "folder",
    },
  });

  // Load department data if editing an existing department
  useEffect(() => {
    const loadDepartmentData = async () => {
      if (departmentId) {
        setIsLoading(true);
        try {
          const department = getDepartmentById(departmentId);
          if (department) {
            form.reset({
              name: department.name,
              description: department.description || "",
              parentId: department.parentId || "none", // Updated default value
              managerId: department.managerId || "none", // Updated default value
              color: department.color || "#6366f1",
              icon: department.icon || "folder",
            });
          }
        } catch (error) {
          console.error("Error loading department data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDepartmentData();
  }, [departmentId, getDepartmentById, form]);

  // Filter available parent departments (exclude self and descendants)
  useEffect(() => {
    // If editing, we need to exclude the current department and its descendants
    const excludedIds = departmentId ? [departmentId] : [];

    // Get all departments except excluded ones
    const availableDepts = departments
      .filter((dept) => !excludedIds.includes(dept.id))
      .map((dept) => ({
        id: dept.id,
        name: dept.name,
        path: formatDepartmentPath(departments, dept.id),
      }))
      .sort((a, b) => a.path.localeCompare(b.path));

    setAvailableParents(availableDepts);
  }, [departments, departmentId]);

  const onSubmit = async (data: DepartmentFormValues) => {
    try {
      setIsSubmitting(true);

      if (departmentId) {
        await updateDepartment(departmentId, data);
      } else {
        await createDepartment(data);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Loading department data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Department description"
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top Level)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>{" "}
                      {/* Updated value */}
                      {availableParents.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                          {dept.path !== dept.name && (
                            <span className="text-muted-foreground text-xs ml-1">
                              ({dept.path})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a parent department if this is a sub-department
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Manager</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No manager assigned</SelectItem>{" "}
                      {/* Updated value */}
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {manager.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Assign a manager to this department
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value || "#6366f1"}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a color for department identification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Icon</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value || "folder"}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select an icon to represent this department
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {departmentId ? "Updating..." : "Creating..."}
              </>
            ) : departmentId ? (
              "Update Department"
            ) : (
              "Create Department"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

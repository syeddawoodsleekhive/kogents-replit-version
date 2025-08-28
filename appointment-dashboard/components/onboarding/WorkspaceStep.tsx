import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { WorkspaceData, workspaceSchema } from "@/types/onboarding";

interface WorkspaceStepProps {
  onSubmit: (data: WorkspaceData) => void;
  onBack: () => void;
  defaultValues: WorkspaceData;
}

const WorkspaceStep = ({
  onSubmit,
  onBack,
  defaultValues,
}: WorkspaceStepProps) => {
  const form = useForm<WorkspaceData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues,
  });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="workspaceEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="admin@example.com"
                    type="email"
                    {...field}
                    readOnly
                  />
                </FormControl>
                <FormDescription>
                  This email will be used for workspace administration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workspaceSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace URL</FormLabel>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">
                    zenchat.com/
                  </span>
                  <FormControl>
                    <Input placeholder="acme-inc" {...field} />
                  </FormControl>
                </div>
                <FormDescription>
                  This will be your unique workspace identifier
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the terms of service and privacy policy
                  </FormLabel>
                  <FormDescription>
                    By checking this box, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onBack} type="button">
              Back
            </Button>
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default WorkspaceStep;

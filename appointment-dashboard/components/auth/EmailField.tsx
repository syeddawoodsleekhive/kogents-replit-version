
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { LoginFormValues } from "./LoginForm";

interface EmailFieldProps {
  control: Control<LoginFormValues>;
  disabled: boolean;
}

export const EmailField = ({ control, disabled }: EmailFieldProps) => {
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              {...field}
              disabled={disabled}
              className="focus:border-primary"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

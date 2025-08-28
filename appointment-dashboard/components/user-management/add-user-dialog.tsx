"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { UserPlus } from "lucide-react";
import { RoleList } from "@/types";

// Dialog state management utilities
const createDialogUtils = () => {
  const useDialogState = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
      console.log("Dialog open state changed:", open);
      setIsOpen(open);
    };

    const handleSuccess = () => {
      setIsOpen(false);
    };

    return {
      isOpen,
      handleOpenChange,
      handleSuccess,
    };
  };

  return { useDialogState };
};

// Button configuration utilities
const createButtonConfig = () => {
  const getButtonProps = (
    variant: string = "default",
    size: string = "default",
    text: string = "Add User",
    showIcon: boolean = true,
    className?: string
  ) => ({
    variant: variant as any,
    size: size as any,
    className,
    children: (
      <>
        {showIcon && <UserPlus className="h-4 w-4 mr-2" />}
        {text}
      </>
    ),
  });

  return { getButtonProps };
};

interface AddUserDialogProps {
  buttonVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonText?: string;
  showIcon?: boolean;
  className?: string;
  getAllRoles: () => Promise<void>;
  roles: RoleList[];
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  buttonVariant = "default",
  buttonSize = "default",
  buttonText = "Add User",
  showIcon = true,
  className,
  getAllRoles,
  roles,
}) => {
  // Initialize utilities
  const dialogUtils = createDialogUtils();
  const buttonConfig = createButtonConfig();
  
  const { isOpen, handleOpenChange, handleSuccess } = dialogUtils.useDialogState();

  // Load roles when dialog opens
  useEffect(() => {
    if (isOpen) {
      getAllRoles();
    }
  }, [isOpen, getAllRoles]);

  const buttonProps = buttonConfig.getButtonProps(
    buttonVariant,
    buttonSize,
    buttonText,
    showIcon,
    className
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button {...buttonProps} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <UserForm onSuccess={handleSuccess} roles={roles} />
      </DialogContent>
    </Dialog>
  );
};

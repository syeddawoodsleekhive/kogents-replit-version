"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserForm } from "./user-form";
import { Edit } from "lucide-react";
import { RoleList } from "@/types";

// Dialog state management utilities
const createDialogUtils = () => {
  const useDialogState = (initialUserId: string) => {
    const [isOpen, setIsOpen] = useState(!!initialUserId);

    const handleClose = () => {
      setIsOpen(false);
    };

    const handleSuccess = () => {
      setIsOpen(false);
    };

    return {
      isOpen,
      handleClose,
      handleSuccess,
    };
  };

  return { useDialogState };
};

// Button configuration utilities
const createButtonConfig = () => {
  const getDefaultButtonProps = (
    variant: string = "outline",
    size: string = "sm",
    className?: string
  ) => ({
    variant: variant as any,
    size: size as any,
    className,
    children: (
      <>
        <Edit className="h-4 w-4 mr-2" />
        Edit User
      </>
    ),
  });

  return { getDefaultButtonProps };
};

interface EditUserDialogProps {
  userId: string;
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  triggerElement?: React.ReactNode;
  buttonVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  hideTriggerElement?: boolean;
  className?: string;
  getAllRoles: () => Promise<void>;
  roles: RoleList[];
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  userId,
  setUserId,
  triggerElement,
  buttonVariant = "outline",
  buttonSize = "sm",
  hideTriggerElement = false,
  className,
  getAllRoles,
  roles,
}) => {
  // Initialize utilities
  const dialogUtils = createDialogUtils();
  const buttonConfig = createButtonConfig();
  
  const { isOpen, handleClose, handleSuccess } = dialogUtils.useDialogState(userId);

  // Load roles when dialog opens
  useEffect(() => {
    if (isOpen) {
      getAllRoles();
    }
  }, [isOpen, getAllRoles]);

  const handleDialogClose = () => {
    setUserId("");
    handleClose();
  };

  const handleFormSuccess = () => {
    handleSuccess();
    setUserId("");
  };

  const defaultButtonProps = buttonConfig.getDefaultButtonProps(
    buttonVariant,
    buttonSize,
    className
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      {!hideTriggerElement && (
        <DialogTrigger asChild>
          {triggerElement || <Button {...defaultButtonProps} />}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <UserForm userId={userId} onSuccess={handleFormSuccess} roles={roles} />
      </DialogContent>
    </Dialog>
  );
};

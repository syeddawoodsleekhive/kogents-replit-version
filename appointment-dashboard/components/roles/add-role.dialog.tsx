"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Axios from "@/lib/axios";
import { Permission } from "@/types";
import { useState } from "react";
import { defaultPermissionsByRole } from "./mock-data";

// Get all unique permissions
const allPermissions = Array.from(
  new Set(Object.values(defaultPermissionsByRole).flat())
);

// Dialog state management utilities
const createDialogUtils = () => {
  const useDialogState = () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"details" | "permissions">("details");
    const [roleId, setRoleId] = useState<string>("");

    const resetDialog = () => {
      setOpen(false);
      setStep("details");
      setRoleId("");
    };

    return {
      open,
      setOpen,
      step,
      setStep,
      roleId,
      setRoleId,
      resetDialog,
    };
  };

  return { useDialogState };
};

// Form state management utilities
const createFormUtils = () => {
  const useFormState = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const resetForm = () => {
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    };

    const togglePermission = (permission: string) => {
      setSelectedPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission]
      );
    };

    return {
      name,
      setName,
      description,
      setDescription,
      selectedPermissions,
      setSelectedPermissions,
      resetForm,
      togglePermission,
    };
  };

  return { useFormState };
};

// API utilities
const createApiUtils = () => {
  const createRole = async (name: string, description: string) => {
    const payload = { name, description };
    const res = await Axios.post("/roles", payload);
    return res.data;
  };

  const addPermissionsToRole = async (roleId: string, permissionIds: string[]) => {
    const payload = { permissionIds };
    const res = await Axios.post(`/roles/${roleId}/permissions`, payload);
    return res.data;
  };

  return { createRole, addPermissionsToRole };
};

// Permission list component
const PermissionList: React.FC<{
  permissions: Permission[];
  selectedPermissions: string[];
  onTogglePermission: (permission: string) => void;
}> = ({ permissions, selectedPermissions, onTogglePermission }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[300px] overflow-y-auto p-6 border rounded-md">
    {permissions.map((permission) => (
      <label
        key={permission.id}
        className="flex items-start space-x-2 text-sm hover:cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selectedPermissions.includes(permission.id)}
          onChange={() => onTogglePermission(permission.id)}
          className="mt-1 hover:cursor-pointer"
        />
        <span>
          <strong className="capitalize">
            {permission.name.replace(/_/g, " ")}
          </strong>
          <div className="text-gray-500 text-xs">
            {permission.description}
          </div>
        </span>
      </label>
    ))}
  </div>
);

// Role details form component
const RoleDetailsForm: React.FC<{
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
}> = ({ name, description, onNameChange, onDescriptionChange, onSubmit }) => (
  <div className="space-y-4 py-2">
    <Input
      placeholder="Role name"
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
    />
    <Input
      placeholder="Role description"
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
    />
    <Button
      onClick={onSubmit}
      className="w-full"
      disabled={!name.trim()}
    >
      Next
    </Button>
  </div>
);

interface AddRoleDialogProps {
  children: React.ReactNode;
  getAllRoles: () => Promise<void>;
  permissions: Permission[];
}

export function AddRoleDialog({
  children,
  permissions,
  getAllRoles,
}: AddRoleDialogProps) {
  // Initialize utilities
  const dialogUtils = createDialogUtils();
  const formUtils = createFormUtils();
  const apiUtils = createApiUtils();

  const { open, setOpen, step, setStep, roleId, setRoleId, resetDialog } = dialogUtils.useDialogState();
  const { name, setName, description, setDescription, selectedPermissions, resetForm, togglePermission } = formUtils.useFormState();

  const createRole = async () => {
    const payload = {
      name: name,
      description: description,
    };
    try {
      const response = await apiUtils.createRole(name, description);
      setStep("permissions");
      setRoleId(response.id);
      setName("");
      setDescription("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddPermissionsToRole = async () => {
    try {
      await apiUtils.addPermissionsToRole(roleId, selectedPermissions);
      setOpen(false);
      setStep("details");
      getAllRoles();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Role</DialogTitle>
        </DialogHeader>

        {step === "details" && (
          <RoleDetailsForm
            name={name}
            description={description}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onSubmit={createRole}
          />
        )}

        {step === "permissions" && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Permissions</h4>
            <PermissionList
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              onTogglePermission={togglePermission}
            />
            <Button
              onClick={handleAddPermissionsToRole}
              className="w-full"
            >
              Create Role
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

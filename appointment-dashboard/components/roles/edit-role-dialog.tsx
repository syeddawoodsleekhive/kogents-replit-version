"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { permissionDescriptions, defaultPermissionsByRole } from "./mock-data";

import type { Permission, RoleList, RolePermissionsResponse } from "@/types";
import Axios from "@/lib/axios";
import { Pencil } from "lucide-react";

const allPermissions = Array.from(
  new Set(Object.values(defaultPermissionsByRole).flat())
);

// Form state management utilities
const createFormUtils = () => {
  const useFormState = (initialName: string, initialDescription: string) => {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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
      isSaving,
      setIsSaving,
      resetForm,
      togglePermission,
    };
  };

  return { useFormState };
};

// API utilities
const createApiUtils = () => {
  const getRolePermissions = async (roleId: string) => {
    const res = await Axios.get(`/roles/${roleId}/permissions`);
    return res.data as RolePermissionsResponse[];
  };

  const updateRoleDetails = async (roleId: string, name: string, description: string) => {
    await Axios.put(`/roles/${roleId}`, { name, description });
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    await Axios.put(`/roles/${roleId}/permissions`, { permissionIds });
  };

  return { getRolePermissions, updateRoleDetails, updateRolePermissions };
};

// Permission list component
const PermissionList: React.FC<{
  permissions: Permission[];
  selectedPermissions: string[];
  onTogglePermission: (permission: string) => void;
  disabled?: boolean;
}> = ({ permissions, selectedPermissions, onTogglePermission, disabled = false }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto border rounded-md p-6">
    {permissions.map((permission) => (
      <label
        key={permission.id}
        className="flex items-start space-x-2 text-sm hover:cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selectedPermissions.includes(permission.id)}
          onChange={() => onTogglePermission(permission.id)}
          disabled={disabled}
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
  onSave: () => void;
  onEditPermissions: () => void;
  isSaving: boolean;
}> = ({ name, description, onNameChange, onDescriptionChange, onSave, onEditPermissions, isSaving }) => (
  <div className="space-y-4 py-2">
    <div className="space-y-1">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={isSaving}
      />
    </div>
    <div className="space-y-1">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        disabled={isSaving}
      />
    </div>

    <DialogFooter>
      <div className="flex justify-between items-center w-full">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <div className="flex gap-2 items-center">
          <Button
            onClick={onEditPermissions}
            type="button"
            variant="outline"
            disabled={isSaving}
          >
            Edit Permissions
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </DialogFooter>
  </div>
);

interface EditRolePopupProps {
  role: RoleList;
  permissions: Permission[];
  open: boolean;
  setOpen: (open: boolean) => void;
  getAllRoles: () => Promise<void>;
}

export function EditRolePopup({
  role,
  open,
  setOpen,
  getAllRoles,
  permissions,
}: EditRolePopupProps) {
  // Initialize utilities
  const formUtils = createFormUtils();
  const apiUtils = createApiUtils();

  const [step, setStep] = useState<"details" | "permissions">("details");
  const { 
    name, 
    setName, 
    description, 
    setDescription, 
    selectedPermissions, 
    setSelectedPermissions,
    isSaving,
    setIsSaving,
    resetForm,
    togglePermission 
  } = formUtils.useFormState(role.name, role.description || "");

  const getRolePermissions = async () => {
    try {
      const response = await apiUtils.getRolePermissions(role.id);
      setSelectedPermissions(response.map((p) => p.permissionId));
    } catch (error) {
      console.error("Error getting role permissions:", error);
    }
  };

  useEffect(() => {
    if (open) {
      setName(role.name);
      setDescription(role.description || "");
      getRolePermissions();
    }
  }, [open, role]);

  const handleUpdateRoleDetails = async () => {
    setIsSaving(true);
    try {
      await apiUtils.updateRoleDetails(role.id, name, description);
      await getAllRoles();
      setOpen(false);
      setStep("details");
      resetForm();
    } catch (error) {
      console.error("Error updating role details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRolePermissions = async () => {
    setIsSaving(true);
    try {
      await apiUtils.updateRolePermissions(role.id, selectedPermissions);
      await getAllRoles();
      setOpen(false);
      setStep("details");
      resetForm();
    } catch (error) {
      console.error("Error updating role permissions:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPermissions = () => {
    setStep("permissions");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {step === "details" && (
            <RoleDetailsForm
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onSave={handleUpdateRoleDetails}
              onEditPermissions={handleEditPermissions}
              isSaving={isSaving}
            />
          )}

          {step === "permissions" && (
            <div className="space-y-4 py-2">
              <Label>Permissions</Label>
              <PermissionList
                permissions={permissions}
                selectedPermissions={selectedPermissions}
                onTogglePermission={togglePermission}
                disabled={isSaving}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSaving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleUpdateRolePermissions} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

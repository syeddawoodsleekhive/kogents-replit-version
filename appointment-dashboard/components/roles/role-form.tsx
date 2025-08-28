import React, { useState } from "react";
import { defaultPermissionsByRole, permissionDescriptions } from "./mock-data";

// Get all unique permissions
const allPermissions = Array.from(
  new Set(Object.values(defaultPermissionsByRole).flat())
);

// Form state management utilities
const createFormUtils = () => {
  const useFormState = (defaultSelected: string[] = []) => {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(defaultSelected);

    const handleCheckboxChange = (permission: string) => {
      setSelectedPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission]
      );
    };

    const resetForm = () => {
      setSelectedPermissions(defaultSelected);
    };

    return {
      selectedPermissions,
      setSelectedPermissions,
      handleCheckboxChange,
      resetForm,
    };
  };

  return { useFormState };
};

// Permission item component
const PermissionItem: React.FC<{
  permission: string;
  isSelected: boolean;
  onToggle: (permission: string) => void;
}> = ({ permission, isSelected, onToggle }) => (
  <label className="flex items-start space-x-2 text-sm">
    <input
      type="checkbox"
      value={permission}
      checked={isSelected}
      onChange={() => onToggle(permission)}
      className="mt-1"
    />
    <span>
      <strong className="capitalize">
        {permission.replace(/_/g, " ")}
      </strong>
      <div className="text-gray-500">
        {permissionDescriptions[permission as keyof typeof permissionDescriptions]}
      </div>
    </span>
  </label>
);

// Permission list component
const PermissionList: React.FC<{
  permissions: string[];
  selectedPermissions: string[];
  onTogglePermission: (permission: string) => void;
}> = ({ permissions, selectedPermissions, onTogglePermission }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
    {permissions.map((permission) => (
      <PermissionItem
        key={permission}
        permission={permission}
        isSelected={selectedPermissions.includes(permission)}
        onToggle={onTogglePermission}
      />
    ))}
  </div>
);

type RoleFormProps = {
  defaultSelected?: string[];
  onSubmit: (selectedPermissions: string[]) => void;
};

export function RoleForm({ defaultSelected = [], onSubmit }: RoleFormProps) {
  // Initialize utilities
  const formUtils = createFormUtils();
  const { selectedPermissions, handleCheckboxChange } = formUtils.useFormState(defaultSelected);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedPermissions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Assign Permissions</h3>
      <PermissionList
        permissions={allPermissions}
        selectedPermissions={selectedPermissions}
        onTogglePermission={handleCheckboxChange}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Role
      </button>
    </form>
  );
}

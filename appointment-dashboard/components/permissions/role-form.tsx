import React, { useState } from "react";
import { defaultPermissionsByRole, permissionDescriptions } from "./mock-data"; // Adjust path if needed

// Get all unique permissions
const allPermissions = Array.from(
  new Set(Object.values(defaultPermissionsByRole).flat())
);

type RoleFormProps = {
  defaultSelected?: string[];
  onSubmit: (selectedPermissions: string[]) => void;
};

export function RoleForm({ defaultSelected = [], onSubmit }: RoleFormProps) {
  const [selectedPermissions, setSelectedPermissions] =
    useState<string[]>(defaultSelected);

  const handleCheckboxChange = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedPermissions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">Assign Permissions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
        {allPermissions.map((permission) => (
          <label
            key={permission}
            className="flex items-start space-x-2 text-sm"
          >
            <input
              type="checkbox"
              value={permission}
              checked={selectedPermissions.includes(permission)}
              onChange={() => handleCheckboxChange(permission)}
              className="mt-1"
            />
            <span>
              <strong className="capitalize">
                {permission.replace(/_/g, " ")}
              </strong>
              <div className="text-gray-500">
                {
                  permissionDescriptions[
                    permission as keyof typeof permissionDescriptions
                  ]
                }
              </div>
            </span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Role
      </button>
    </form>
  );
}

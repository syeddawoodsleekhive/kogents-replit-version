"use client";

import { AddRoleDialog } from "@/components/roles/add-role.dialog";
import { RoleList } from "@/components/roles/roles-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Axios from "@/lib/axios";
import {
  GetAllPermissionsResponse,
  RoleList as IRole,
  Permission,
} from "@/types";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function RolesPage() {
  const mockRoles = [
    {
      id: "1",
      name: "Admin",
      description: "Full access to manage the platform",
      userCount: 3,
    },
    {
      id: "2",
      name: "Editor",
      description: "Can edit content but not manage users",
      userCount: 5,
    },
    {
      id: "3",
      name: "Viewer",
      description: "Read-only access",
      userCount: 12,
    },
    {
      id: "4",
      name: "HR Manager",
      description: "Access to employee records",
      userCount: 2,
    },
    {
      id: "5",
      name: "Developer",
      description: "Access to code and technical documentation",
      userCount: 4,
    },
  ];

  const [roles, setRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>();
  const [searchQuery, setSearchQuery] = useState("");

  const getAllRoles = async () => {
    try {
      const res = await Axios.get("/roles");
      setRoles(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getAllPermissions = async () => {
    try {
      const res = await Axios.get("/permissions");
      const response: GetAllPermissionsResponse = res.data;
      setPermissions(response.permissions);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllRoles();
    getAllPermissions();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Manage your organization's roles
          </p>
        </div>
        <AddRoleDialog
          getAllRoles={getAllRoles}
          permissions={permissions || []}
        >
          <Button onClick={getAllPermissions}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        </AddRoleDialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search roles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <RoleList
        roles={roles}
        permissions={permissions || []}
        isLoading={false}
        searchQuery={searchQuery}
        getAllRoles={getAllRoles}
      />
    </div>
  );
}

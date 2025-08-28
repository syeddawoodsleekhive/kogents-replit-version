"use client";

import { AddPermissionDialog } from "@/components/permissions/add-permission.dialog";
import { PermissionList } from "@/components/permissions/permission-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Axios from "@/lib/axios";
import { GetAllPermissionsResponse, Permission } from "@/types";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>();

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
    getAllPermissions();
  }, []);

  const getAllCategories = async () => {
    try {
      const res = await Axios.get("/permissions/categories");
      const response = res.data;
      setCategories(response.categories);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground">
            Manage your organization's permissions
          </p>
        </div>
        <AddPermissionDialog
          categories={categories || []}
          setPermissions={setPermissions}
          permissions={permissions || []}
        >
          <Button onClick={getAllCategories}>
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </Button>
        </AddPermissionDialog>
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

      <PermissionList
        permissions={permissions || []}
        setPermissions={setPermissions}
        isLoading={false}
        searchQuery={searchQuery}
        categories={categories || []}
      />
    </div>
  );
}

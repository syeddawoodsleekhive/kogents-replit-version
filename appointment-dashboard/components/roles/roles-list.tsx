"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Axios from "@/lib/axios";
import type { Permission, RoleList as Role } from "@/types";
import { MoreHorizontal, Pencil, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EditRolePopup } from "./edit-role-dialog";

// Filter utilities
const createFilterUtils = () => {
  const filterRoles = (roles: Role[], searchQuery: string): Role[] => {
    if (!searchQuery.trim()) {
      return roles;
    }

    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  };

  return { filterRoles };
};

// API utilities
const createApiUtils = () => {
  const deleteRole = async (roleId: string) => {
    await Axios.delete(`/roles/${roleId}`);
  };

  return { deleteRole };
};

// Loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Empty state component
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => (
  <Card>
    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
      <div className="rounded-full bg-muted p-3">
        <Shield className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No roles found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery
          ? "Try adjusting your search query"
          : "Get started by creating your first role"}
      </p>
    </CardContent>
  </Card>
);

// Role table row component
const RoleTableRow: React.FC<{
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
}> = ({ role, onEdit, onDelete }) => (
  <TableRow key={role.id}>
    <TableCell className="font-medium">{role.name}</TableCell>
    <TableCell>{role.description || "-"}</TableCell>
    <TableCell>
      <Badge variant="outline" className="font-normal text-nowrap">
        {role._count.users} {role._count.users <= 1 ? "user" : "users"}
      </Badge>
    </TableCell>
    <TableCell>
      <Badge variant="outline" className="font-normal text-nowrap">
        {role._count.rolePermissions}{" "}
        {role._count.rolePermissions <= 1 ? "permission" : "permissions"}
      </Badge>
    </TableCell>
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              setTimeout(() => onEdit(role), 100);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onDelete(role.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
);

// Delete confirmation dialog component
const DeleteConfirmationDialog: React.FC<{
  roleToDelete: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ roleToDelete, isDeleting, onConfirm, onCancel }) => (
  <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the role and
          remove it from our servers.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

interface RoleListProps {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  searchQuery?: string;
  getAllRoles: () => Promise<void>;
}

export function RoleList({
  roles,
  permissions,
  isLoading,
  searchQuery = "",
  getAllRoles,
}: RoleListProps) {
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);

  // Initialize utilities
  const filterUtils = createFilterUtils();
  const apiUtils = createApiUtils();

  useEffect(() => {
    const filtered = filterUtils.filterRoles(roles, searchQuery);
    setFilteredRoles(filtered);
  }, [roles, searchQuery, filterUtils]);

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      await apiUtils.deleteRole(roleToDelete);
      await getAllRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      setIsDeleting(false);
      setRoleToDelete(null);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRoleForEdit(role);
  };

  const handleDeleteRoleClick = (roleId: string) => {
    setRoleToDelete(roleId);
  };

  const handleCloseEditDialog = () => {
    setSelectedRoleForEdit(null);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (filteredRoles.length === 0) {
    return <EmptyState searchQuery={searchQuery} />;
  }

  return (
    <>
      <EditRolePopup
        role={selectedRoleForEdit || ({} as Role)}
        permissions={permissions}
        getAllRoles={getAllRoles}
        open={!!selectedRoleForEdit}
        setOpen={handleCloseEditDialog}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <RoleTableRow
                  key={role.id}
                  role={role}
                  onEdit={handleEditRole}
                  onDelete={handleDeleteRoleClick}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        roleToDelete={roleToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteRole}
        onCancel={() => setRoleToDelete(null)}
      />
    </>
  );
}

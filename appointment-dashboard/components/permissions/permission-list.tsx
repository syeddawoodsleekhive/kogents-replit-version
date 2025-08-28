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
import { EditPermissionPopup } from "./edit-permission-dialog";

// Filter utilities
const createFilterUtils = () => {
  const filterPermissions = (permissions: Permission[], searchQuery: string): Permission[] => {
    if (!searchQuery.trim()) {
      return permissions;
    }

    const query = searchQuery.toLowerCase();
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query)
    );
  };

  return { filterPermissions };
};

// API utilities
const createApiUtils = () => {
  const deletePermission = async (permissionId: string) => {
    const response = await Axios.delete(`/permissions/${permissionId}`);
    return response;
  };

  return { deletePermission };
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
      <h3 className="mt-4 text-lg font-medium">No permissions found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery
          ? "Try adjusting your search query"
          : "Get started by creating your first permission"}
      </p>
    </CardContent>
  </Card>
);

// Permission table row component
const PermissionTableRow: React.FC<{
  permission: Permission;
  onEdit: (permission: Permission) => void;
  onDelete: (permissionId: string) => void;
}> = ({ permission, onEdit, onDelete }) => (
  <TableRow key={permission.id}>
    <TableCell className="font-medium">
      {permission.name}
    </TableCell>
    <TableCell>{permission.description || "-"}</TableCell>
    <TableCell>{permission.category || "-"}</TableCell>
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Edit functionality is commented out in original code */}
          {/* <DropdownMenuItem
            onSelect={(e) => {
              setTimeout(
                () => onEdit(permission),
                100
              );
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem> */}
          <DropdownMenuItem
            onSelect={() => onDelete(permission.id)}
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
  permissionToDelete: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ permissionToDelete, isDeleting, onConfirm, onCancel }) => (
  <AlertDialog open={!!permissionToDelete} onOpenChange={(open) => !open && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the
          permission and remove it from our servers.
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

interface PermissionListProps {
  permissions: Permission[];
  isLoading: boolean;
  searchQuery?: string;
  setPermissions: (permissions: Permission[]) => void;
  categories: string[];
}

export function PermissionList({
  permissions,
  isLoading,
  searchQuery = "",
  setPermissions,
  categories,
}: PermissionListProps) {
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPermissionForEdit, setSelectedPermissionForEdit] = useState<Permission | null>(null);

  // Initialize utilities
  const filterUtils = createFilterUtils();
  const apiUtils = createApiUtils();

  useEffect(() => {
    const filtered = filterUtils.filterPermissions(permissions, searchQuery);
    setFilteredPermissions(filtered);
  }, [permissions, searchQuery, filterUtils]);

  const handleDeletePermission = async () => {
    if (!permissionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await apiUtils.deletePermission(permissionToDelete);
      if (response) {
        setPermissions(permissions.filter((p) => p.id !== permissionToDelete));
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
    } finally {
      setIsDeleting(false);
      setPermissionToDelete(null);
    }
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermissionForEdit(permission);
  };

  const handleDeletePermissionClick = (permissionId: string) => {
    setPermissionToDelete(permissionId);
  };

  const handleCloseEditDialog = () => {
    setSelectedPermissionForEdit(null);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (filteredPermissions.length === 0) {
    return <EmptyState searchQuery={searchQuery} />;
  }

  return (
    <>
      <EditPermissionPopup
        permission={selectedPermissionForEdit || ({} as Permission)}
        open={!!selectedPermissionForEdit}
        setOpen={handleCloseEditDialog}
        categories={categories}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => (
                <PermissionTableRow
                  key={permission.id}
                  permission={permission}
                  onEdit={handleEditPermission}
                  onDelete={handleDeletePermissionClick}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        permissionToDelete={permissionToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeletePermission}
        onCancel={() => setPermissionToDelete(null)}
      />
    </>
  );
}

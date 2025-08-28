"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Trash2,
  Filter,
  Search,
  X,
  Edit,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "./user-avatar";
import { useUsers } from "./user-context";
import type { User, UserRole, UserStatus } from "./types";
import { AddUserDialog } from "./add-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { formatDistanceToNow } from "date-fns";
import UserListSkeleton from "../skeleton/user-list-skeleton";
import Axios from "@/lib/axios";
import { RoleList } from "@/types";

// Utility functions
const createFilterHandlers = (filters: any, setFilters: (filters: any) => void) => ({
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  },
  handleRoleFilter: (value: string) => {
    setFilters({
      ...filters,
      role: value === "all" ? undefined : (value as UserRole),
    });
  },
  handleStatusFilter: (value: string) => {
    setFilters({
      ...filters,
      status: value === "all" ? undefined : (value as UserStatus),
    });
  },
  handleDepartmentFilter: (value: string) => {
    setFilters({ ...filters, department: value === "all" ? undefined : value });
  },
  clearFilters: () => {
    setFilters({});
  },
});

const createBadgeUtils = () => ({
  getStatusBadgeColor: (status: UserStatus) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800 hover:bg-green-200",
      inactive: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      suspended: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  },
  getRoleBadgeColor: (role: User["role"]) => {
    const roleColors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      manager: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      agent: "bg-green-100 text-green-800 hover:bg-green-200",
      viewer: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  },
});

const formatLastActive = (dateString?: string) => {
  if (!dateString) {
    return formatDistanceToNow(new Date(), { addSuffix: true });
  }
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    return "Invalid date";
  }
};

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Filter panel component
const FilterPanel: React.FC<{
  filters: any;
  onRoleFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
}> = ({ filters, onRoleFilter, onStatusFilter, onClearFilters, onClose }) => (
  <div
    id="filter-panel"
    className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/20"
  >
    <div className="space-y-2">
      <label htmlFor="role-filter" className="text-sm font-medium">
        Role
      </label>
      <Select value={filters.role || "all"} onValueChange={onRoleFilter}>
        <SelectTrigger id="role-filter" className="w-full">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="agent">Agent</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label htmlFor="status-filter" className="text-sm font-medium">
        Status
      </label>
      <Select value={filters.status || "all"} onValueChange={onStatusFilter}>
        <SelectTrigger id="status-filter" className="w-full">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="col-span-1 sm:col-span-3 flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        className="text-muted-foreground"
      >
        <X className="h-4 w-4 mr-2" />
        Clear filters
      </Button>
    </div>
  </div>
);

// User table row component
const UserTableRow: React.FC<{
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  onView: (userId: string) => void;
  getStatusBadgeColor: (status: UserStatus) => string;
  getRoleBadgeColor: (role: User["role"]) => string;
  workspace: string;
}> = ({ user, onEdit, onDelete, onView, getStatusBadgeColor, getRoleBadgeColor, workspace }) => (
  <TableRow key={user.id}>
    <TableCell>
      <div className="flex items-center gap-3">
        <UserAvatar user={user} showStatus />
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Badge
        variant="outline"
        className={getStatusBadgeColor(user.status)}
      >
        {capitalizeFirst(user.status)}
      </Badge>
    </TableCell>
    <TableCell>{formatLastActive(user.lastActive)}</TableCell>
    <TableCell className="text-nowrap">
      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
        {capitalizeFirst(user.role)}
      </Badge>
    </TableCell>
    <TableCell className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(user.id)}>
            <Eye className="h-4 w-4 mr-2" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(user.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit user
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onSelect={(e) => {
              e.preventDefault();
              onDelete(user.id);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
);

export const UserList: React.FC = () => {
  const router = useRouter();
  const { workspace } = useParams();
  const {
    filteredUsers,
    filters,
    setFilters,
    deleteUser,
    hasPermission,
    isLoading,
  } = useUsers();

  console.log("filteredUsers", filteredUsers);

  const [showFilters, setShowFilters] = useState(false);
  const [editUser, setEditUser] = useState<string>("");
  const [roles, setRoles] = useState<RoleList[]>([]);

  const canManageUsers = hasPermission("manage_users");

  // Initialize utilities
  const filterHandlers = createFilterHandlers(filters, setFilters);
  const badgeUtils = createBadgeUtils();

  const getAllRoles = useCallback(async () => {
    try {
      const res = await Axios.get("/roles");
      setRoles(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleEditUser = (userId: string) => {
    setTimeout(() => setEditUser(userId), 100);
  };

  const handleViewUser = (userId: string) => {
    router.push(`/${workspace}/users/${userId}`);
  };

  const handleClearFilters = () => {
    filterHandlers.clearFilters();
    setShowFilters(false);
  };

  if (isLoading) return <UserListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={filters.search || ""}
            onChange={filterHandlers.handleSearch}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && filters.search === undefined && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>

          <AddUserDialog
            buttonSize="sm"
            getAllRoles={getAllRoles}
            roles={roles}
          />
        </div>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          onRoleFilter={filterHandlers.handleRoleFilter}
          onStatusFilter={filterHandlers.handleStatusFilter}
          onClearFilters={handleClearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No users found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onView={handleViewUser}
                  getStatusBadgeColor={badgeUtils.getStatusBadgeColor}
                  getRoleBadgeColor={badgeUtils.getRoleBadgeColor}
                  workspace={workspace as string}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {editUser && (
        <EditUserDialog
          userId={editUser}
          setUserId={setEditUser}
          hideTriggerElement
          getAllRoles={getAllRoles}
          roles={roles}
        />
      )}
    </div>
  );
};

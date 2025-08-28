"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Axios from "@/lib/axios";
import { RoleList } from "@/types";
import { format } from "date-fns";
import {
  Calendar,
  Edit,
  Key,
  Mail,
  Phone,
  Shield,
  UserCog
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import type { Permission, User } from "./types";
import { UserAvatar } from "./user-avatar";
import { useUsers } from "./user-context";
import { UserForm } from "./user-form";

// Utility functions
const createBadgeUtils = () => ({
  getRoleBadgeColor: (role: User["role"]) => {
    const roleColors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      manager: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      agent: "bg-green-100 text-green-800 hover:bg-green-200",
      viewer: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    return roleColors[role] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  },
  getStatusBadgeColor: (status: User["status"]) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800 hover:bg-green-200",
      inactive: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      suspended: "bg-red-100 text-red-800 hover:bg-red-200",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200";
  },
});

const createDateUtils = () => ({
  formatDate: (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  },
  formatTime: (dateString: string) => {
    try {
      return format(new Date(dateString), "p");
    } catch (error) {
      return "Invalid time";
    }
  },
});

const createPermissionUtils = () => ({
  getPermissionCategoryIcon: (permission: Permission) => {
    const iconMap: Record<string, React.ReactNode> = {
      user: <UserCog className="h-4 w-4" />,
      appointment: <Calendar className="h-4 w-4" />,
      setting: <Shield className="h-4 w-4" />,
      chat: <Mail className="h-4 w-4" />,
      email: <Mail className="h-4 w-4" />,
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (permission.includes(key)) return icon;
    }
    return <Key className="h-4 w-4" />;
  },
});

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Contact information component
const ContactInformation: React.FC<{ userData: any }> = ({ userData }) => {
  const dateUtils = createDateUtils();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          User's contact details and basic information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Email:</span>
            <a
              href={`mailto:${userData.email}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {userData.email}
            </a>
          </div>

          {userData.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Phone:</span>
              <a href={`tel:${userData.phone}`} className="text-sm">
                {userData.phone}
              </a>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Created:</span>
            <span className="text-sm">
              {dateUtils.formatDate(new Date().toISOString())}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Role information component
const RoleInformation: React.FC<{ userData: any; badgeUtils: any }> = ({ userData, badgeUtils }) => (
  <Card>
    <CardHeader>
      <CardTitle>Role Information</CardTitle>
      <CardDescription>
        Details about user's role and access level
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Role</h3>
          <p className="mt-1">
            <Badge
              variant="outline"
              className={badgeUtils.getRoleBadgeColor(userData.role.name)}
            >
              {capitalizeFirst(userData.role.name)}
            </Badge>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Status</h3>
          <p className="mt-1">
            <Badge
              variant="outline"
              className={badgeUtils.getStatusBadgeColor(userData.status)}
            >
              {capitalizeFirst(userData.status)}
            </Badge>
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Account information component
const AccountInformation: React.FC<{ userData: any }> = ({ userData }) => {
  const dateUtils = createDateUtils();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>
          User account details and identifiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">User ID</h3>
            <p className="mt-1 text-sm font-mono">{userData.id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Created On</h3>
            <p className="mt-1 text-sm">
              {dateUtils.formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// User header component
const UserHeader: React.FC<{ userData: any; badgeUtils: any; onEditClick: () => void }> = ({ 
  userData, 
  badgeUtils, 
  onEditClick 
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div className="flex items-center gap-4">
      <UserAvatar user={userData} size="lg" showStatus />
      <div>
        <h1 className="text-2xl font-bold">{userData.name}</h1>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge
            variant="outline"
            className={badgeUtils.getRoleBadgeColor(userData.role.name)}
          >
            {capitalizeFirst(userData.role.name)}
          </Badge>
          <Badge
            variant="outline"
            className={badgeUtils.getStatusBadgeColor(userData.status)}
          >
            {capitalizeFirst(userData.status)}
          </Badge>
        </div>
      </div>
    </div>

    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={onEditClick}>
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </DialogTrigger>
    </Dialog>
  </div>
);

interface UserDetailProps {
  userId: string;
}

export const UserDetail: React.FC<UserDetailProps> = ({ userId }) => {
  const { getUserDataById, hasPermission, userData, isLoading } = useUsers();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [roles, setRoles] = useState<RoleList[]>([]);

  // Initialize utilities
  const badgeUtils = createBadgeUtils();

  const getAllRoles = useCallback(async () => {
    try {
      const res = await Axios.get("/roles");
      setRoles(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (isEditDialogOpen) {
      getAllRoles();
    }
  }, [isEditDialogOpen, getAllRoles]);

  useEffect(() => {
    if (userId) {
      getUserDataById(userId);
    }
  }, [userId, getUserDataById]);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserHeader 
        userData={userData} 
        badgeUtils={badgeUtils} 
        onEditClick={handleEditClick}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <ContactInformation userData={userData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RoleInformation userData={userData} badgeUtils={badgeUtils} />
            <AccountInformation userData={userData} />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent user activity and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Activity tracking will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <UserForm
              userId={userData.id}
              onSuccess={handleEditSuccess}
              roles={roles}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserRole, Permission } from "./types"
import { defaultPermissionsByRole, roleDescriptions, permissionDescriptions } from "./mock-data"
import { Shield, Edit, Check, X } from "lucide-react"

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Record<UserRole, Permission[]>>({
    admin: defaultPermissionsByRole.admin as Permission[],
    manager: defaultPermissionsByRole.manager as Permission[],
    agent: defaultPermissionsByRole.agent as Permission[],
    viewer: defaultPermissionsByRole.viewer as Permission[],
  })

  const [editingRole, setEditingRole] = useState<UserRole | null>(null)
  const [tempPermissions, setTempPermissions] = useState<Permission[]>([])

  const handleEditRole = (role: UserRole) => {
    setEditingRole(role)
    setTempPermissions([...roles[role]])
  }

  const handleSaveRole = () => {
    if (editingRole) {
      setRoles((prev) => ({
        ...prev,
        [editingRole]: tempPermissions,
      }))
      setEditingRole(null)
    }
  }

  const handleTogglePermission = (permission: Permission) => {
    if (tempPermissions.includes(permission)) {
      setTempPermissions((prev) => prev.filter((p) => p !== permission))
    } else {
      setTempPermissions((prev) => [...prev, permission])
    }
  }

  const allPermissions = Object.keys(permissionDescriptions) as Permission[]

  const permissionCategories = {
    users: allPermissions.filter((p) => p.includes("user")),
    appointments: allPermissions.filter((p) => p.includes("appointment")),
    settings: allPermissions.filter((p) => p.includes("setting")),
    logs: allPermissions.filter((p) => p.includes("chat") || p.includes("email")),
    other: allPermissions.filter(
      (p) =>
        !p.includes("user") &&
        !p.includes("appointment") &&
        !p.includes("setting") &&
        !p.includes("chat") &&
        !p.includes("email"),
    ),
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Role Management</CardTitle>
          <CardDescription>Configure permissions for each user role</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(roles).map(([role, permissions]) => (
              <TableRow key={role}>
                <TableCell>
                  <Badge variant="outline" className="font-medium">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{roleDescriptions[role as UserRole]}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="mr-1">
                      {permissions.length}
                    </Badge>
                    {permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.split("_")[0]}
                      </Badge>
                    ))}
                    {permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role as UserRole)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit {role.charAt(0).toUpperCase() + role.slice(1)} Role Permissions</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Role Name</Label>
                          <Input value={role.charAt(0).toUpperCase() + role.slice(1)} disabled />
                        </div>

                        <div className="space-y-4">
                          <Label>Permissions</Label>

                          {Object.entries(permissionCategories).map(
                            ([category, categoryPermissions]) =>
                              categoryPermissions.length > 0 && (
                                <div key={category} className="border rounded-md p-4">
                                  <h3 className="font-medium mb-2 flex items-center">
                                    <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {categoryPermissions.map((permission) => (
                                      <div key={permission} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`${role}-${permission}`}
                                          checked={tempPermissions.includes(permission)}
                                          onCheckedChange={() => handleTogglePermission(permission)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                          <label
                                            htmlFor={`${role}-${permission}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {permission
                                              .split("_")
                                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                              .join(" ")}
                                          </label>
                                          <p className="text-sm text-muted-foreground">
                                            {permissionDescriptions[permission]}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRole(null)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveRole}>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { UserAvatar } from "@/components/user-management/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Camera } from "lucide-react"
import { ProfileEditForm } from "./profile-edit-form"
import type { CreateUserResponse, User } from "@/components/user-management/types"

interface ProfileHeaderProps {
  user: CreateUserResponse
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "manager":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "agent":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "viewer":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="relative group">
          <UserAvatar user={user} size="lg" showStatus />
          <button
            onClick={() => setIsAvatarDialogOpen(true)}
            className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Change profile picture"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className={getRoleBadgeColor(user.role.name)}>
              {user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1)}
            </Badge>
            {/* {user.department && <Badge variant="outline">{user.department}</Badge>} */}
          </div>
        </div>
      </div>

      <Button onClick={() => setIsEditDialogOpen(true)} className="shrink-0">
        <Edit className="h-4 w-4 mr-2" />
        Edit Profile
      </Button>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <ProfileEditForm user={user} onSuccess={() => setIsEditDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Change Avatar Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <UserAvatar user={user} size="lg" />
            </div>
            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full">
                Upload New Picture
              </Button>
              <Button variant="destructive" className="w-full">
                Remove Picture
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Recommended: Square image, at least 400x400 pixels
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

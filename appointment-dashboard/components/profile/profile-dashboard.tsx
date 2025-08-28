"use client"

import { useState } from "react"
import { useUsers } from "@/components/user-management/user-context"
import { ProfileHeader } from "./profile-header"
import { ProfileTabs } from "./profile-tabs"
import { Skeleton } from "@/components/ui/skeleton"

export function ProfileDashboard() {
  const { currentUser, isLoading } = useUsers()
  const [activeTab, setActiveTab] = useState("personal-info")

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg">
        <p className="text-muted-foreground">User profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ProfileHeader user={currentUser} />
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

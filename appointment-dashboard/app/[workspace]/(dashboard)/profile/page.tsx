"use client"

import { UserProvider } from "@/components/user-management/user-context"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"

export default function ProfilePage() {
  
  return (
    <UserProvider>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <ProfileDashboard />
      </div>
    </UserProvider>
  )
}

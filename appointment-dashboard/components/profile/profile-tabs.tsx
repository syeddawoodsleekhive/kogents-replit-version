"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalInfoTab } from "./tabs/personal-info-tab"
import { SecurityTab } from "./tabs/security-tab"
import { NotificationsTab } from "./tabs/notifications-tab"
import { ActivityTab } from "./tabs/activity-tab"
import { PreferencesTab } from "./tabs/preferences-tab"
import { User, Lock, Bell, Clock, Settings } from "lucide-react"

interface ProfileTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function ProfileTabs({ activeTab, setActiveTab }: ProfileTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1">
        <TabsTrigger value="personal-info" className="flex items-center gap-2 py-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Personal Info</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2 py-2">
          <Lock className="h-4 w-4" />
          <span>Security</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
          <span className="sm:hidden">Alerts</span>
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2 py-2">
          <Clock className="h-4 w-4" />
          <span>Activity</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2 py-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Preferences</span>
          <span className="sm:hidden">Prefs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal-info">
        <PersonalInfoTab />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTab />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesTab />
      </TabsContent>
    </Tabs>
  )
}

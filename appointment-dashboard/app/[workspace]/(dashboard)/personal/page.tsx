"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button as UIButton } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProfileTabContent } from "@/components/personal/tabs/profile-tab-content";
import { PreferencesTabContent } from "@/components/personal/tabs/preferences-tab-content";
import { SoundsTabContent } from "@/components/personal/tabs/sounds-tab-content";
import { IdleTimeoutTabContent } from "@/components/personal/tabs/idle-timeout-tab-content";
import { EmailReportsTabContent } from "@/components/personal/tabs/email-reports-tab-content";
import { LabsTabContent } from "@/components/personal/tabs/labs-tab-content";

export default function PersonalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Personal</h1>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="sounds">Sounds & notifications</TabsTrigger>
            <TabsTrigger value="idle">Idle timeout</TabsTrigger>
            <TabsTrigger value="email">Email reports</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTabContent />
            <PreferencesTabContent />
            <div className="flex gap-2 pt-6">
              <UIButton type="button" className="text-sm bg-primary text-white">Save changes</UIButton>
              <UIButton type="button" variant="outline">Revert changes</UIButton>
            </div>
          </TabsContent>
          <TabsContent value="sounds">
            <SoundsTabContent />
          </TabsContent>
          <TabsContent value="idle">
            <IdleTimeoutTabContent />
          </TabsContent>
          <TabsContent value="email">
            <EmailReportsTabContent />
          </TabsContent>
          <TabsContent value="labs">
            <LabsTabContent />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

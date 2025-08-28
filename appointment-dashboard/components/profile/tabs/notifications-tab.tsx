"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState({
    appointments: true,
    reminders: true,
    updates: false,
    marketing: false,
  })

  const [appNotifications, setAppNotifications] = useState({
    appointments: true,
    reminders: true,
    messages: true,
    updates: true,
  })

  const [smsNotifications, setSmsNotifications] = useState({
    appointments: false,
    reminders: false,
    urgent: true,
  })

  const handleEmailChange = (key: keyof typeof emailNotifications) => {
    setEmailNotifications({
      ...emailNotifications,
      [key]: !emailNotifications[key],
    })
  }

  const handleAppChange = (key: keyof typeof appNotifications) => {
    setAppNotifications({
      ...appNotifications,
      [key]: !appNotifications[key],
    })
  }

  const handleSmsChange = (key: keyof typeof smsNotifications) => {
    setSmsNotifications({
      ...smsNotifications,
      [key]: !smsNotifications[key],
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage the emails you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-appointments">Appointment Updates</Label>
              <p className="text-sm text-muted-foreground">Receive emails about your appointment schedule changes</p>
            </div>
            <Switch
              id="email-appointments"
              checked={emailNotifications.appointments}
              onCheckedChange={() => handleEmailChange("appointments")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reminders">Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive reminder emails about upcoming appointments</p>
            </div>
            <Switch
              id="email-reminders"
              checked={emailNotifications.reminders}
              onCheckedChange={() => handleEmailChange("reminders")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">System Updates</Label>
              <p className="text-sm text-muted-foreground">Receive emails about system updates and new features</p>
            </div>
            <Switch
              id="email-updates"
              checked={emailNotifications.updates}
              onCheckedChange={() => handleEmailChange("updates")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-marketing">Marketing</Label>
              <p className="text-sm text-muted-foreground">Receive marketing emails and newsletters</p>
            </div>
            <Switch
              id="email-marketing"
              checked={emailNotifications.marketing}
              onCheckedChange={() => handleEmailChange("marketing")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>Manage your in-app notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app-appointments">Appointment Updates</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about appointment changes</p>
            </div>
            <Switch
              id="app-appointments"
              checked={appNotifications.appointments}
              onCheckedChange={() => handleAppChange("appointments")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app-reminders">Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive reminders about upcoming appointments</p>
            </div>
            <Switch
              id="app-reminders"
              checked={appNotifications.reminders}
              onCheckedChange={() => handleAppChange("reminders")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app-messages">Messages</Label>
              <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
            </div>
            <Switch
              id="app-messages"
              checked={appNotifications.messages}
              onCheckedChange={() => handleAppChange("messages")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="app-updates">System Updates</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about system updates</p>
            </div>
            <Switch
              id="app-updates"
              checked={appNotifications.updates}
              onCheckedChange={() => handleAppChange("updates")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>Manage text message notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-appointments">Appointment Updates</Label>
              <p className="text-sm text-muted-foreground">Receive SMS notifications about appointment changes</p>
            </div>
            <Switch
              id="sms-appointments"
              checked={smsNotifications.appointments}
              onCheckedChange={() => handleSmsChange("appointments")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-reminders">Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive SMS reminders about upcoming appointments</p>
            </div>
            <Switch
              id="sms-reminders"
              checked={smsNotifications.reminders}
              onCheckedChange={() => handleSmsChange("reminders")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-urgent">Urgent Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive SMS for urgent and critical notifications</p>
            </div>
            <Switch
              id="sms-urgent"
              checked={smsNotifications.urgent}
              onCheckedChange={() => handleSmsChange("urgent")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Notification Preferences</Button>
      </div>
    </div>
  )
}

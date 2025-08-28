"use client"

import type React from "react"

import { useState } from "react"
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ReminderSettingsProps {
  trigger?: React.ReactNode
}

export function ReminderSettings({ trigger }: ReminderSettingsProps) {
  const [open, setOpen] = useState(false)

  // Reminder settings state
  const [enableReminders, setEnableReminders] = useState(true)
  const [reminderTimes, setReminderTimes] = useState<string[]>(["1-day", "1-hour"])
  const [defaultReminderMethod, setDefaultReminderMethod] = useState("email")

  // Email notification settings
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [emailTemplate, setEmailTemplate] = useState("default")
  const [customEmailSubject, setCustomEmailSubject] = useState("Reminder: Your appointment is coming up")

  // SMS notification settings
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [smsTemplate, setSmsTemplate] = useState("default")
  const [customSmsText, setCustomSmsText] = useState(
    "Reminder: Your appointment is coming up soon. Please arrive 10 minutes early.",
  )

  // In-app notification settings
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [notificationSound, setNotificationSound] = useState(true)

  // Staff notification settings
  const [notifyStaff, setNotifyStaff] = useState(true)
  const [staffReminderTimes, setStaffReminderTimes] = useState<string[]>(["1-day", "1-hour"])

  // Handle reminder time toggle
  const toggleReminderTime = (time: string) => {
    if (reminderTimes.includes(time)) {
      setReminderTimes(reminderTimes.filter((t) => t !== time))
    } else {
      setReminderTimes([...reminderTimes, time])
    }
  }

  // Handle staff reminder time toggle
  const toggleStaffReminderTime = (time: string) => {
    if (staffReminderTimes.includes(time)) {
      setStaffReminderTimes(staffReminderTimes.filter((t) => t !== time))
    } else {
      setStaffReminderTimes([...staffReminderTimes, time])
    }
  }

  // Save settings
  const saveSettings = () => {
    toast({
      title: "Reminder settings saved",
      description: "Your notification preferences have been updated.",
    })
    setOpen(false)
  }

  // Test notification
  const sendTestNotification = () => {
    toast({
      title: "Test notification sent",
      description: "A test notification has been sent to your email and phone.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Reminder Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Appointment Reminder Settings</DialogTitle>
          <DialogDescription>
            Configure how and when appointment reminders are sent to customers and staff.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-reminders" className="text-base">
                  Enable Automated Reminders
                </Label>
                <p className="text-sm text-muted-foreground">Send automatic reminders for upcoming appointments</p>
              </div>
              <Switch id="enable-reminders" checked={enableReminders} onCheckedChange={setEnableReminders} />
            </div>

            {enableReminders && (
              <>
                <div className="space-y-2 mt-4">
                  <Label className="text-base">When to Send Reminders</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select when reminders should be sent before the appointment
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-1-week"
                        checked={reminderTimes.includes("1-week")}
                        onCheckedChange={() => toggleReminderTime("1-week")}
                      />
                      <Label htmlFor="reminder-1-week">1 week before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-3-days"
                        checked={reminderTimes.includes("3-days")}
                        onCheckedChange={() => toggleReminderTime("3-days")}
                      />
                      <Label htmlFor="reminder-3-days">3 days before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-1-day"
                        checked={reminderTimes.includes("1-day")}
                        onCheckedChange={() => toggleReminderTime("1-day")}
                      />
                      <Label htmlFor="reminder-1-day">1 day before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-3-hours"
                        checked={reminderTimes.includes("3-hours")}
                        onCheckedChange={() => toggleReminderTime("3-hours")}
                      />
                      <Label htmlFor="reminder-3-hours">3 hours before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-1-hour"
                        checked={reminderTimes.includes("1-hour")}
                        onCheckedChange={() => toggleReminderTime("1-hour")}
                      />
                      <Label htmlFor="reminder-1-hour">1 hour before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminder-15-min"
                        checked={reminderTimes.includes("15-min")}
                        onCheckedChange={() => toggleReminderTime("15-min")}
                      />
                      <Label htmlFor="reminder-15-min">15 minutes before</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-base">Default Reminder Method</Label>
                  <p className="text-sm text-muted-foreground mb-2">Choose the primary method for sending reminders</p>
                  <RadioGroup
                    value={defaultReminderMethod}
                    onValueChange={setDefaultReminderMethod}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="method-email" />
                      <Label htmlFor="method-email" className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Email (Primary)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="method-sms" />
                      <Label htmlFor="method-sms" className="flex items-center">
                        <Smartphone className="mr-2 h-4 w-4" />
                        SMS Text Message
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="method-both" />
                      <Label htmlFor="method-both" className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Both Email and SMS
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <Label htmlFor="in-app-notifications" className="text-base">
                      In-App Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">Show notifications in the dashboard</p>
                  </div>
                  <Switch id="in-app-notifications" checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
                </div>

                {inAppEnabled && (
                  <div className="flex items-center justify-between mt-4 pl-4">
                    <div>
                      <Label htmlFor="notification-sound" className="text-base">
                        Notification Sound
                      </Label>
                      <p className="text-sm text-muted-foreground">Play a sound when new notifications arrive</p>
                    </div>
                    <Switch
                      id="notification-sound"
                      checked={notificationSound}
                      onCheckedChange={setNotificationSound}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-enabled" className="text-base">
                  Email Reminders
                </Label>
                <p className="text-sm text-muted-foreground">Send appointment reminders via email</p>
              </div>
              <Switch id="email-enabled" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            {emailEnabled && (
              <>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="email-template" className="text-base">
                    Email Template
                  </Label>
                  <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                    <SelectTrigger id="email-template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="minimal">Minimal Template</SelectItem>
                      <SelectItem value="branded">Branded Template</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="email-subject" className="text-base">
                    Email Subject
                  </Label>
                  <Input
                    id="email-subject"
                    value={customEmailSubject}
                    onChange={(e) => setCustomEmailSubject(e.target.value)}
                    placeholder="Enter email subject line"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{appointment_date}"}, {"{appointment_time}"}, {"{service_name}"},{" "}
                    {"{customer_name}"}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-base">Email Preview</Label>
                  <Card>
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">
                        {customEmailSubject
                          .replace("{appointment_date}", "05/10/2025")
                          .replace("{appointment_time}", "10:00 AM")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 text-sm">
                      <p>Hello John,</p>
                      <p className="mt-2">This is a reminder that you have an appointment scheduled for:</p>
                      <p className="mt-2 font-medium">Service: Dental Checkup</p>
                      <p className="font-medium">Date: May 10, 2025</p>
                      <p className="font-medium">Time: 10:00 AM</p>
                      <p className="mt-2">Please arrive 10 minutes early to complete any necessary paperwork.</p>
                      <p className="mt-2">If you need to reschedule, please contact us at least 24 hours in advance.</p>
                    </CardContent>
                    <CardFooter className="py-2 text-xs text-muted-foreground border-t">
                      <p>This is an automated reminder. Please do not reply to this email.</p>
                    </CardFooter>
                  </Card>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" onClick={sendTestNotification}>
                    Send Test Email
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-enabled" className="text-base">
                  SMS Reminders
                </Label>
                <p className="text-sm text-muted-foreground">Send appointment reminders via text message</p>
              </div>
              <Switch id="sms-enabled" checked={smsEnabled} onCheckedChange={setSmsEnabled} />
            </div>

            {smsEnabled && (
              <>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="sms-template" className="text-base">
                    SMS Template
                  </Label>
                  <Select value={smsTemplate} onValueChange={setSmsTemplate}>
                    <SelectTrigger id="sms-template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="brief">Brief Template</SelectItem>
                      <SelectItem value="detailed">Detailed Template</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="sms-text" className="text-base">
                    SMS Text
                  </Label>
                  <div className="relative">
                    <textarea
                      id="sms-text"
                      value={customSmsText}
                      onChange={(e) => setCustomSmsText(e.target.value)}
                      placeholder="Enter SMS message text"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                      {customSmsText.length}/160 characters
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{date}"}, {"{time}"}, {"{service}"}, {"{name}"}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-base">SMS Preview</Label>
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/10 p-3 rounded-lg max-w-[80%]">
                          <p className="text-sm">
                            {customSmsText
                              .replace("{date}", "May 10, 2025")
                              .replace("{time}", "10:00 AM")
                              .replace("{service}", "Dental Checkup")
                              .replace("{name}", "John")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" onClick={sendTestNotification}>
                    Send Test SMS
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-staff" className="text-base">
                  Staff Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders to staff members about upcoming appointments
                </p>
              </div>
              <Switch id="notify-staff" checked={notifyStaff} onCheckedChange={setNotifyStaff} />
            </div>

            {notifyStaff && (
              <>
                <div className="space-y-2 mt-4">
                  <Label className="text-base">Staff Reminder Times</Label>
                  <p className="text-sm text-muted-foreground mb-2">Select when staff should receive reminders</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff-reminder-1-day"
                        checked={staffReminderTimes.includes("1-day")}
                        onCheckedChange={() => toggleStaffReminderTime("1-day")}
                      />
                      <Label htmlFor="staff-reminder-1-day">1 day before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff-reminder-3-hours"
                        checked={staffReminderTimes.includes("3-hours")}
                        onCheckedChange={() => toggleStaffReminderTime("3-hours")}
                      />
                      <Label htmlFor="staff-reminder-3-hours">3 hours before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff-reminder-1-hour"
                        checked={staffReminderTimes.includes("1-hour")}
                        onCheckedChange={() => toggleStaffReminderTime("1-hour")}
                      />
                      <Label htmlFor="staff-reminder-1-hour">1 hour before</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="staff-reminder-30-min"
                        checked={staffReminderTimes.includes("30-min")}
                        onCheckedChange={() => toggleStaffReminderTime("30-min")}
                      />
                      <Label htmlFor="staff-reminder-30-min">30 minutes before</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-base">Staff Notification Methods</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="staff-email" defaultChecked />
                      <Label htmlFor="staff-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="staff-sms" defaultChecked />
                      <Label htmlFor="staff-sms">SMS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="staff-app" defaultChecked />
                      <Label htmlFor="staff-app">In-App</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="staff-calendar" defaultChecked />
                      <Label htmlFor="staff-calendar">Calendar Invite</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label className="text-base">Daily Schedule Summary</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="daily-summary" defaultChecked />
                    <Label htmlFor="daily-summary">Send daily schedule summary to staff</Label>
                  </div>
                  <Select defaultValue="morning">
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (7:00 AM)</SelectItem>
                      <SelectItem value="evening">Evening (8:00 PM, for next day)</SelectItem>
                      <SelectItem value="both">Both Morning and Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

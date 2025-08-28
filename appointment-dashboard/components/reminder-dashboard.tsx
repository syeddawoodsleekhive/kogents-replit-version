"use client"

import { useState } from "react"
import { Check, Clock, Mail, MoreHorizontal, RefreshCw, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { ReminderSettings } from "@/components/reminder-settings"

// Upcoming reminders to be sent
const upcomingReminders = [
  {
    id: "reminder-1",
    appointmentId: "APT-1001",
    customer: "Sarah Johnson",
    service: "Dental Checkup",
    date: "2025-05-07",
    time: "09:30 AM",
    reminderTime: "1 hour before",
    methods: ["email", "sms"],
    status: "scheduled",
    scheduledFor: "08:30 AM today",
  },
  {
    id: "reminder-2",
    appointmentId: "APT-1004",
    customer: "James Rodriguez",
    service: "Legal Consultation",
    date: "2025-05-08",
    time: "10:00 AM",
    reminderTime: "1 day before",
    methods: ["email"],
    status: "scheduled",
    scheduledFor: "10:00 AM tomorrow",
  },
  {
    id: "reminder-3",
    appointmentId: "APT-1006",
    customer: "David Kim",
    service: "Financial Planning",
    date: "2025-05-09",
    time: "01:00 PM",
    reminderTime: "1 day before",
    methods: ["email", "sms"],
    status: "scheduled",
    scheduledFor: "01:00 PM, May 8",
  },
  {
    id: "reminder-4",
    appointmentId: "APT-1007",
    customer: "Lisa Wang",
    service: "Physical Therapy",
    date: "2025-05-10",
    time: "11:30 AM",
    reminderTime: "3 days before",
    methods: ["email"],
    status: "scheduled",
    scheduledFor: "11:30 AM, May 7",
  },
  {
    id: "reminder-5",
    appointmentId: "APT-1010",
    customer: "Thomas Brown",
    service: "Home Inspection",
    date: "2025-05-14",
    time: "10:00 AM",
    reminderTime: "1 week before",
    methods: ["email", "sms"],
    status: "scheduled",
    scheduledFor: "10:00 AM, May 7",
  },
]

// Reminder history
const reminderHistory = [
  {
    id: "history-1",
    appointmentId: "APT-1002",
    customer: "Michael Chen",
    service: "Tax Consultation",
    date: "2025-05-07",
    time: "11:00 AM",
    reminderTime: "3 hours before",
    methods: ["email", "sms"],
    status: "sent",
    sentAt: "08:00 AM today",
  },
  {
    id: "history-2",
    appointmentId: "APT-1003",
    customer: "Emma Wilson",
    service: "Hair Styling",
    date: "2025-05-07",
    time: "02:15 PM",
    reminderTime: "1 day before",
    methods: ["email"],
    status: "sent",
    sentAt: "02:15 PM yesterday",
  },
  {
    id: "history-3",
    appointmentId: "APT-1005",
    customer: "Olivia Taylor",
    service: "Therapy Session",
    date: "2025-05-08",
    time: "03:30 PM",
    reminderTime: "1 day before",
    methods: ["email", "sms"],
    status: "failed",
    sentAt: "03:30 PM yesterday",
    error: "Invalid phone number",
  },
  {
    id: "history-4",
    appointmentId: "APT-1008",
    customer: "Robert Smith",
    service: "Career Counseling",
    date: "2025-05-12",
    time: "02:00 PM",
    reminderTime: "1 week before",
    methods: ["email"],
    status: "sent",
    sentAt: "02:00 PM, May 5",
  },
  {
    id: "history-5",
    appointmentId: "APT-1009",
    customer: "Jennifer Lopez",
    service: "Nutritional Consultation",
    date: "2025-05-12",
    time: "09:00 AM",
    reminderTime: "3 days before",
    methods: ["email", "sms"],
    status: "sent",
    sentAt: "09:00 AM, May 9",
  },
]

export function ReminderDashboard() {
  const [activeTab, setActiveTab] = useState("upcoming")
  const [localUpcomingReminders, setLocalUpcomingReminders] = useState(upcomingReminders)
  const [localReminderHistory, setLocalReminderHistory] = useState(reminderHistory)

  // Stats
  const totalScheduled = localUpcomingReminders.length
  const totalSent = localReminderHistory.filter((r) => r.status === "sent").length
  const totalFailed = localReminderHistory.filter((r) => r.status === "failed").length
  const successRate = totalSent > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 100

  // Send a reminder now
  const sendReminderNow = (reminderId: string) => {
    // Find the reminder
    const reminder = localUpcomingReminders.find((r) => r.id === reminderId)
    if (!reminder) return

    // Remove from upcoming
    setLocalUpcomingReminders(localUpcomingReminders.filter((r) => r.id !== reminderId))

    // Add to history
    const newHistoryItem = {
      id: `history-${Date.now()}`,
      appointmentId: reminder.appointmentId,
      customer: reminder.customer,
      service: reminder.service,
      date: reminder.date,
      time: reminder.time,
      reminderTime: reminder.reminderTime,
      methods: reminder.methods,
      status: "sent",
      sentAt: "Just now",
    }

    setLocalReminderHistory([newHistoryItem, ...localReminderHistory])

    // Show success toast
    toast({
      title: "Reminder Sent",
      description: `Reminder for ${reminder.service} with ${reminder.customer} has been sent.`,
    })
  }

  // Cancel a scheduled reminder
  const cancelReminder = (reminderId: string) => {
    setLocalUpcomingReminders(localUpcomingReminders.filter((r) => r.id !== reminderId))

    toast({
      title: "Reminder Cancelled",
      description: "The scheduled reminder has been cancelled.",
    })
  }

  // Retry a failed reminder
  const retryReminder = (reminderId: string) => {
    // Find the failed reminder
    const failedReminder = localReminderHistory.find((r) => r.id === reminderId && r.status === "failed")
    if (!failedReminder) return

    // Update its status
    setLocalReminderHistory(
      localReminderHistory.map((r) =>
        r.id === reminderId ? { ...r, status: "sent", sentAt: "Just now", error: null } : r,
      ),
    )

    // Show success toast
    toast({
      title: "Reminder Resent",
      description: `Reminder for ${failedReminder.service} with ${failedReminder.customer} has been resent.`,
    })
  }

  // Get method badges
  const getMethodBadges = (methods: string[]) => {
    return (
      <div className="flex gap-1">
        {methods.includes("email") && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Mail className="mr-1 h-3 w-3" />
            Email
          </Badge>
        )}
        {methods.includes("sms") && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Smartphone className="mr-1 h-3 w-3" />
            SMS
          </Badge>
        )}
      </div>
    )
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <X className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Appointment Reminders</h2>
          <p className="text-muted-foreground">Manage and monitor automated appointment reminders</p>
        </div>
        <ReminderSettings />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reminders</CardTitle>
            <CardDescription>Upcoming reminders to be sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScheduled}</div>
            <p className="text-xs text-muted-foreground">For the next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reminders Sent</CardTitle>
            <CardDescription>Successfully delivered reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CardDescription>Delivery success percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <Progress value={successRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Reminders</TabsTrigger>
          <TabsTrigger value="history">Reminder History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reminders</CardTitle>
              <CardDescription>Reminders that will be automatically sent to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Reminder Time</TableHead>
                    <TableHead>Methods</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localUpcomingReminders.length > 0 ? (
                    localUpcomingReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">{reminder.customer}</TableCell>
                        <TableCell>
                          <div>{reminder.service}</div>
                          <div className="text-xs text-muted-foreground">
                            {reminder.date} at {reminder.time}
                          </div>
                        </TableCell>
                        <TableCell>{reminder.reminderTime}</TableCell>
                        <TableCell>{getMethodBadges(reminder.methods)}</TableCell>
                        <TableCell>{reminder.scheduledFor}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => sendReminderNow(reminder.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => cancelReminder(reminder.id)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel Reminder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No upcoming reminders scheduled.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>Record of reminders that have been sent or failed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Reminder Time</TableHead>
                    <TableHead>Methods</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localReminderHistory.length > 0 ? (
                    localReminderHistory.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">{reminder.customer}</TableCell>
                        <TableCell>
                          <div>{reminder.service}</div>
                          <div className="text-xs text-muted-foreground">
                            {reminder.date} at {reminder.time}
                          </div>
                        </TableCell>
                        <TableCell>{reminder.reminderTime}</TableCell>
                        <TableCell>{getMethodBadges(reminder.methods)}</TableCell>
                        <TableCell>
                          {getStatusBadge(reminder.status)}
                          {reminder.error && <div className="text-xs text-red-500 mt-1">{reminder.error}</div>}
                        </TableCell>
                        <TableCell>{reminder.sentAt}</TableCell>
                        <TableCell className="text-right">
                          {reminder.status === "failed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => retryReminder(reminder.id)}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Retry
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-8 px-2" disabled>
                              <Check className="mr-1 h-3 w-3" />
                              Sent
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No reminder history available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                Export History
              </Button>
              <Button variant="outline" size="sm">
                Clear History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

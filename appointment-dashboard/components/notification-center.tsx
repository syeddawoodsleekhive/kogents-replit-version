"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, Check, Clock, Mail, MoreHorizontal, Smartphone, X, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { ReminderSettings } from "@/components/reminder-settings"

// Mock notification data
const initialNotifications = [
  {
    id: "notif-1",
    type: "reminder",
    title: "Upcoming Appointment",
    message: "Dental Checkup with Sarah Johnson in 1 hour (09:30 AM)",
    time: "08:30 AM",
    date: "2025-05-07",
    read: false,
    appointmentId: "APT-1001",
    method: "app",
  },
  {
    id: "notif-2",
    type: "reminder",
    title: "Upcoming Appointment",
    message: "Tax Consultation with Michael Chen in 3 hours (11:00 AM)",
    time: "08:00 AM",
    date: "2025-05-07",
    read: true,
    appointmentId: "APT-1002",
    method: "app",
  },
  {
    id: "notif-3",
    type: "email",
    title: "Email Reminder Sent",
    message: "Reminder email sent to Emma Wilson for Hair Styling appointment",
    time: "Yesterday",
    date: "2025-05-06",
    read: true,
    appointmentId: "APT-1003",
    method: "email",
  },
  {
    id: "notif-4",
    type: "sms",
    title: "SMS Reminder Sent",
    message: "Reminder SMS sent to James Rodriguez for Legal Consultation",
    time: "Yesterday",
    date: "2025-05-06",
    read: true,
    appointmentId: "APT-1004",
    method: "sms",
  },
  {
    id: "notif-5",
    type: "reminder",
    title: "Upcoming Appointment",
    message: "Financial Planning with David Kim tomorrow at 01:00 PM",
    time: "01:00 PM",
    date: "2025-05-08",
    read: false,
    appointmentId: "APT-1006",
    method: "app",
  },
]

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
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
    toast({
      title: "All notifications marked as read",
      description: `${unreadCount} notifications have been marked as read.`,
    })
  }

  // Mark a single notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    })
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([])
    toast({
      title: "All notifications cleared",
      description: "All notifications have been removed.",
    })
  }

  // Simulate a new notification arriving
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only add a new notification if the popover is closed to avoid disrupting the user
      if (!open) {
        const newNotification = {
          id: `notif-${Date.now()}`,
          type: "reminder",
          title: "Upcoming Appointment",
          message: "Home Inspection with Thomas Brown in 3 days (May 14, 10:00 AM)",
          time: "Just now",
          date: "2025-05-11",
          read: false,
          appointmentId: "APT-1010",
          method: "app",
        }

        setNotifications((prev) => [newNotification, ...prev])

        // Show a toast notification
        toast({
          title: "New Appointment Reminder",
          description: "Home Inspection with Thomas Brown in 3 days",
        })
      }
    }, 30000) // Show a new notification after 30 seconds

    return () => clearTimeout(timer)
  }, [open])

  // Get notifications for the active tab
  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications
    if (activeTab === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === activeTab)
  }

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4 text-primary" />
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />
      case "sms":
        return <Smartphone className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-primary" />
    }
  }

  // Send a test reminder
  const sendTestReminder = () => {
    toast({
      title: "Test Reminder Sent",
      description: "A test reminder has been sent to all configured channels.",
    })
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h4 className="font-medium">Notifications</h4>
            <div className="flex items-center gap-2">
              <ReminderSettings
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={markAllAsRead}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearAllNotifications}>
                    <X className="mr-2 h-4 w-4" />
                    Clear all notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={sendTestReminder}>
                    <Bell className="mr-2 h-4 w-4" />
                    Send test reminder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="relative rounded-none border-b-2 border-b-transparent py-2 px-4 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="relative rounded-none border-b-2 border-b-transparent py-2 px-4 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Unread
                  {unreadCount > 0 && <Badge className="ml-1 h-5 px-1 bg-primary">{unreadCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger
                  value="reminder"
                  className="relative rounded-none border-b-2 border-b-transparent py-2 px-4 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Reminders
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[300px]">
                {getFilteredNotifications().length > 0 ? (
                  getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 border-b last:border-b-0 ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs text-muted-foreground">You're all caught up! No new notifications.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <ScrollArea className="h-[300px]">
                {getFilteredNotifications().length > 0 ? (
                  getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 border-b last:border-b-0 bg-muted/50"
                    >
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Check className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">No unread notifications</p>
                    <p className="text-xs text-muted-foreground">You've read all your notifications.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reminder" className="m-0">
              <ScrollArea className="h-[300px]">
                {getFilteredNotifications().length > 0 ? (
                  getFilteredNotifications().map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 border-b last:border-b-0 ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="mt-1">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">No reminder notifications</p>
                    <p className="text-xs text-muted-foreground">You have no upcoming appointment reminders.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between p-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/settings/notifications">Manage Settings</a>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

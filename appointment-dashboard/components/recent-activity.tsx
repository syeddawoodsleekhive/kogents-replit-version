"use client"

import { useState } from "react"
import { Check, X, Calendar, Clock, RefreshCw, MessageSquare, UserPlus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Mock data for recent activity
const activities = [
  {
    id: 1,
    type: "new_appointment",
    appointment: {
      id: "APT-1007",
      service: "Business Consultation",
    },
    customer: {
      name: "Jennifer Lee",
      avatar: "/stylized-jl-logo.png",
    },
    time: "10 minutes ago",
    message: "New appointment booked via AI chatbot",
  },
  {
    id: 2,
    type: "status_change",
    appointment: {
      id: "APT-1003",
      service: "Hair Styling",
    },
    customer: {
      name: "Emma Wilson",
      avatar: "/graffiti-ew.png",
    },
    time: "45 minutes ago",
    message: "Appointment marked as completed",
    oldStatus: "confirmed",
    newStatus: "completed",
  },
  {
    id: 3,
    type: "reschedule",
    appointment: {
      id: "APT-1002",
      service: "Tax Consultation",
    },
    customer: {
      name: "Michael Chen",
      avatar: "/microphone-concert-stage.png",
    },
    time: "2 hours ago",
    message: "Appointment rescheduled",
    oldDate: "2025-05-06",
    oldTime: "02:00 PM",
    newDate: "2025-05-07",
    newTime: "11:00 AM",
  },
  {
    id: 4,
    type: "note_added",
    appointment: {
      id: "APT-1001",
      service: "Dental Checkup",
    },
    customer: {
      name: "Sarah Johnson",
      avatar: "/stylized-letters-sj.png",
    },
    time: "3 hours ago",
    message: "Note added to appointment",
    note: "Patient mentioned sensitivity in upper right molar.",
  },
  {
    id: 5,
    type: "cancellation",
    appointment: {
      id: "APT-1005",
      service: "Therapy Session",
    },
    customer: {
      name: "Olivia Taylor",
      avatar: "/abstract-ot.png",
    },
    time: "5 hours ago",
    message: "Appointment cancelled",
    reason: "Client illness",
  },
  {
    id: 6,
    type: "new_customer",
    customer: {
      name: "Robert Garcia",
      avatar: "/abstract-geometric-rg.png",
    },
    time: "Yesterday",
    message: "New customer registered via AI chatbot",
  },
  {
    id: 7,
    type: "reminder_sent",
    appointment: {
      id: "APT-1004",
      service: "Legal Consultation",
    },
    customer: {
      name: "James Rodriguez",
      avatar: "/stylized-jr-logo.png",
    },
    time: "Yesterday",
    message: "Appointment reminder sent",
  },
]

export function RecentActivity() {
  const [filter, setFilter] = useState("all")

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true
    return activity.type === filter
  })

  const getActivityIcon = (type) => {
    switch (type) {
      case "new_appointment":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "status_change":
        return <Check className="h-5 w-5 text-blue-500" />
      case "reschedule":
        return <RefreshCw className="h-5 w-5 text-amber-500" />
      case "note_added":
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case "cancellation":
        return <X className="h-5 w-5 text-red-500" />
      case "new_customer":
        return <UserPlus className="h-5 w-5 text-cyan-500" />
      case "reminder_sent":
        return <Clock className="h-5 w-5 text-indigo-500" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All Activity
        </Button>
        <Button
          variant={filter === "new_appointment" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("new_appointment")}
        >
          New Bookings
        </Button>
        <Button
          variant={filter === "status_change" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("status_change")}
        >
          Status Changes
        </Button>
        <Button
          variant={filter === "reschedule" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("reschedule")}
        >
          Reschedules
        </Button>
        <Button
          variant={filter === "cancellation" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("cancellation")}
        >
          Cancellations
        </Button>
      </div>

      <div className="space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="flex gap-4 p-4 border rounded-lg">
              <div className="mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{activity.message}</div>
                  <Badge variant="outline">{activity.time}</Badge>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {activity.customer && (
                    <>
                      <img
                        src={activity.customer.avatar || "/placeholder.svg"}
                        alt={activity.customer.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm">{activity.customer.name}</span>
                    </>
                  )}

                  {activity.appointment && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm">{activity.appointment.id}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm">{activity.appointment.service}</span>
                    </>
                  )}
                </div>

                {activity.type === "reschedule" && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Rescheduled from {activity.oldDate} at {activity.oldTime} to {activity.newDate} at{" "}
                    {activity.newTime}
                  </div>
                )}

                {activity.type === "status_change" && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Status changed from{" "}
                    <Badge variant="outline" className="text-xs">
                      {activity.oldStatus}
                    </Badge>{" "}
                    to{" "}
                    <Badge variant="outline" className="text-xs">
                      {activity.newStatus}
                    </Badge>
                  </div>
                )}

                {activity.type === "note_added" && (
                  <div className="mt-2 text-sm italic border-l-2 pl-2 py-1">"{activity.note}"</div>
                )}

                {activity.type === "cancellation" && activity.reason && (
                  <div className="mt-2 text-sm text-muted-foreground">Reason: {activity.reason}</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">No activity found for the selected filter.</div>
        )}
      </div>
    </div>
  )
}

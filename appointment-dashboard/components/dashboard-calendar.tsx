"use client"

import { useState } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isToday } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Reuse the appointment data from the UserInformationPanel
const appointments = [
  {
    id: "APT-1001",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 123-4567",
      avatar: "/stylized-letters-sj.png",
    },
    service: "Dental Checkup",
    date: "2025-05-07",
    time: "09:30 AM",
    duration: "45 min",
    status: "confirmed",
    notes: "Patient mentioned sensitivity in upper right molar.",
    source: "chatbot",
  },
  {
    id: "APT-1002",
    customer: {
      name: "Michael Chen",
      email: "m.chen@example.com",
      phone: "(555) 234-5678",
      avatar: "/microphone-concert-stage.png",
    },
    service: "Tax Consultation",
    date: "2025-05-07",
    time: "11:00 AM",
    duration: "60 min",
    status: "pending",
    notes: "First-time client, needs help with small business taxes.",
    source: "chatbot",
  },
  {
    id: "APT-1003",
    customer: {
      name: "Emma Wilson",
      email: "emma.w@example.com",
      phone: "(555) 345-6789",
      avatar: "/graffiti-ew.png",
    },
    service: "Hair Styling",
    date: "2025-05-07",
    time: "14:15 PM",
    duration: "90 min",
    status: "completed",
    notes: "Requested same style as previous appointment.",
    source: "chatbot",
  },
  {
    id: "APT-1004",
    customer: {
      name: "James Rodriguez",
      email: "j.rodriguez@example.com",
      phone: "(555) 456-7890",
      avatar: "/stylized-jr-logo.png",
    },
    service: "Legal Consultation",
    date: "2025-05-08",
    time: "10:00 AM",
    duration: "60 min",
    status: "confirmed",
    notes: "Discussing contract review for new business.",
    source: "website",
  },
  {
    id: "APT-1005",
    customer: {
      name: "Olivia Taylor",
      email: "o.taylor@example.com",
      phone: "(555) 567-8901",
      avatar: "/abstract-ot.png",
    },
    service: "Therapy Session",
    date: "2025-05-08",
    time: "15:30 PM",
    duration: "50 min",
    status: "cancelled",
    notes: "Cancelled due to illness, needs to reschedule.",
    source: "phone",
  },
  {
    id: "APT-1006",
    customer: {
      name: "David Kim",
      email: "d.kim@example.com",
      phone: "(555) 678-9012",
      avatar: "/abstract-geometric-dk.png",
    },
    service: "Financial Planning",
    date: "2025-05-09",
    time: "13:00 PM",
    duration: "75 min",
    status: "pending",
    notes: "Bringing spouse to discuss retirement options.",
    source: "email",
  },
  {
    id: "APT-1007",
    customer: {
      name: "Lisa Wang",
      email: "l.wang@example.com",
      phone: "(555) 789-0123",
      avatar: "/abstract-lw.png",
    },
    service: "Physical Therapy",
    date: "2025-05-10",
    time: "11:30 AM",
    duration: "60 min",
    status: "confirmed",
    notes: "Follow-up for knee rehabilitation.",
    source: "chatbot",
  },
  {
    id: "APT-1008",
    customer: {
      name: "Robert Smith",
      email: "r.smith@example.com",
      phone: "(555) 890-1234",
      avatar: "/abstract-rs.png",
    },
    service: "Career Counseling",
    date: "2025-05-12",
    time: "14:00 PM",
    duration: "45 min",
    status: "pending",
    notes: "Discussing career transition options.",
    source: "website",
  },
  {
    id: "APT-1009",
    customer: {
      name: "Jennifer Lopez",
      email: "j.lopez@example.com",
      phone: "(555) 901-2345",
      avatar: "/stylized-jl-logo.png",
    },
    service: "Nutritional Consultation",
    date: "2025-05-12",
    time: "09:00 AM",
    duration: "30 min",
    status: "confirmed",
    notes: "Initial consultation for diet planning.",
    source: "chatbot",
  },
  {
    id: "APT-1010",
    customer: {
      name: "Thomas Brown",
      email: "t.brown@example.com",
      phone: "(555) 012-3456",
      avatar: "/abstract-geometric-tb.png",
    },
    service: "Home Inspection",
    date: "2025-05-14",
    time: "10:00 AM",
    duration: "120 min",
    status: "confirmed",
    notes: "Pre-purchase inspection for new home.",
    source: "phone",
  },
]

// Helper function to get the time in 24-hour format for sorting
const getTimeValue = (timeStr: string) => {
  const [time, period] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)

  if (period === "PM" && hours !== 12) {
    hours += 12
  } else if (period === "AM" && hours === 12) {
    hours = 0
  }

  return hours * 60 + minutes
}

// Helper function to get appointments for a specific day
const getAppointmentsForDay = (date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd")
  return appointments
    .filter((appointment) => appointment.date === dateStr)
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time))
}

// Helper function to get the status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 border-green-500 text-green-800"
    case "pending":
      return "bg-amber-100 border-amber-500 text-amber-800"
    case "completed":
      return "bg-blue-100 border-blue-500 text-blue-800"
    case "cancelled":
      return "bg-red-100 border-red-500 text-red-800"
    default:
      return "bg-gray-100 border-gray-500 text-gray-800"
  }
}

// Helper function to get the status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-500">Confirmed</Badge>
    case "pending":
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500">
          Pending
        </Badge>
      )
    case "completed":
      return <Badge className="bg-blue-500">Completed</Badge>
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Generate days for the current week
  const days = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  })

  // Navigation functions
  const previousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle appointment click
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setIsDetailsOpen(true)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Appointment Calendar</CardTitle>
            <CardDescription>View upcoming appointments for the week</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-muted">
            {days.map((day) => (
              <div
                key={day.toString()}
                className={`p-2 text-center border-r last:border-r-0 ${isToday(day) ? "bg-primary/10 font-bold" : ""}`}
              >
                <div className="font-medium">{format(day, "EEE")}</div>
                <div className="text-sm">{format(day, "MMM d")}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x h-[300px]">
            {days.map((day) => {
              const dayAppointments = getAppointmentsForDay(day)
              return (
                <div key={day.toString()} className={`overflow-y-auto ${isToday(day) ? "bg-primary/5" : ""}`}>
                  {dayAppointments.length > 0 ? (
                    dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`m-1 p-2 rounded border-l-4 text-sm cursor-pointer ${getStatusColor(
                          appointment.status,
                        )}`}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="font-medium">{appointment.time}</div>
                        <div className="font-medium truncate">{appointment.service}</div>
                        <div className="truncate">{appointment.customer.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      No appt.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {selectedAppointment && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>Complete information about appointment {selectedAppointment.id}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedAppointment.customer.avatar || "/placeholder.svg"}
                    alt={selectedAppointment.customer.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{selectedAppointment.customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.customer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedAppointment.customer.phone}</p>
                  </div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Service</h4>
                    <p>{selectedAppointment.service}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                    <p>{selectedAppointment.duration}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                    <p>{selectedAppointment.date}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                    <p>{selectedAppointment.time}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Source</h4>
                    <p className="capitalize">{selectedAppointment.source}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="mt-1">{selectedAppointment.notes}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

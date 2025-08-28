"use client"

import React from "react"

import { useState, useRef } from "react"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  isSameDay,
  setHours,
  setMinutes,
  addMinutes,
  startOfDay,
  endOfDay,
} from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight, Download, FileText, Grid3X3, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SearchFilterSystem, type FilterValue } from "@/components/search-filter-system"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
    staff: "Dr. Anderson",
    room: "Room 3",
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
    staff: "Jennifer Lee",
    room: "Office 2",
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
    staff: "Carlos Rodriguez",
    room: "Station 5",
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
    staff: "Maria Garcia",
    room: "Conference A",
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
    staff: "Dr. Williams",
    room: "Room 7",
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
    staff: "Robert Johnson",
    room: "Office 5",
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
    staff: "Dr. Martinez",
    room: "Therapy Room 2",
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
    staff: "Emily Chen",
    room: "Office 3",
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
    staff: "Dr. Thompson",
    room: "Room 1",
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
    staff: "Alex Johnson",
    room: "Field Visit",
  },
]

// Helper function to get the time in 24-hour format for sorting
const getTimeValue = (timeStr) => {
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
const getAppointmentsForDay = (date, filteredAppointments) => {
  const dateStr = format(date, "yyyy-MM-dd")
  return filteredAppointments
    .filter((appointment) => appointment.date === dateStr)
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time))
}

// Helper function to get the status color
const getStatusColor = (status) => {
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
const getStatusBadge = (status) => {
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

// Helper function to parse duration string to minutes
const parseDuration = (durationStr) => {
  const match = durationStr.match(/(\d+)\s*min/)
  return match ? Number.parseInt(match[1]) : 60 // Default to 60 minutes if parsing fails
}

// Helper function to convert time string to Date object
const timeStringToDate = (dateStr, timeStr) => {
  const date = parseISO(dateStr)
  const [time, period] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)

  if (period === "PM" && hours !== 12) {
    hours += 12
  } else if (period === "AM" && hours === 12) {
    hours = 0
  }

  return setMinutes(setHours(date, hours), minutes)
}

// Helper function to format date to iCal format
const formatDateToICal = (date) => {
  return date.toISOString().replace(/-|:|\.\d+/g, "")
}

// Helper function to generate iCal file content
const generateICalContent = (appointments) => {
  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AppointmentSystem//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  appointments.forEach((appointment) => {
    const startDate = timeStringToDate(appointment.date, appointment.time)
    const endDate = addMinutes(startDate, parseDuration(appointment.duration))

    icalContent = [
      ...icalContent,
      "BEGIN:VEVENT",
      `UID:${appointment.id}@appointmentsystem`,
      `DTSTAMP:${formatDateToICal(new Date())}`,
      `DTSTART:${formatDateToICal(startDate)}`,
      `DTEND:${formatDateToICal(endDate)}`,
      `SUMMARY:${appointment.service} with ${appointment.customer.name}`,
      `DESCRIPTION:${appointment.notes}`,
      `LOCATION:${appointment.room}`,
      `STATUS:${appointment.status.toUpperCase()}`,
      `ORGANIZER;CN=${appointment.staff}:mailto:staff@example.com`,
      `ATTENDEE;CN=${appointment.customer.name}:mailto:${appointment.customer.email}`,
      "END:VEVENT",
    ]
  })

  icalContent.push("END:VCALENDAR")
  return icalContent.join("\r\n")
}

// Helper function to download calendar as iCal file
const downloadCalendarAsICal = (appointments, filename = "calendar.ics") => {
  const icalContent = generateICalContent(appointments)
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("week")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [filteredAppointments, setFilteredAppointments] = useState(appointments)
  const [draggedAppointment, setDraggedAppointment] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dropTarget, setDropTarget] = useState(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("ical")
  const [exportDateRange, setExportDateRange] = useState("visible")
  const [exportCustomStartDate, setExportCustomStartDate] = useState("")
  const [exportCustomEndDate, setExportCustomEndDate] = useState("")
  const [selectedAppointmentsForExport, setSelectedAppointmentsForExport] = useState([])
  const [exportAllAppointments, setExportAllAppointments] = useState(true)
  const [resourceView, setResourceView] = useState("time") // 'time', 'staff', or 'room'

  // Reference for the calendar container (for drag and drop)
  const calendarRef = useRef(null)

  // Handle filter changes
  const handleFilterChange = (filters: FilterValue) => {
    const filtered = appointments.filter((appointment) => {
      // Search filter
      const searchMatch =
        !filters.search ||
        appointment.customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        appointment.service.toLowerCase().includes(filters.search.toLowerCase())

      // Status filter
      const statusMatch = filters.status.length === 0 || filters.status.includes(appointment.status)

      // Date range filter
      let dateMatch = true
      if (filters.dateRange.from || filters.dateRange.to) {
        const appointmentDate = parseISO(appointment.date)

        if (filters.dateRange.from && filters.dateRange.to) {
          dateMatch = isWithinInterval(appointmentDate, {
            start: filters.dateRange.from,
            end: filters.dateRange.to,
          })
        } else if (filters.dateRange.from) {
          dateMatch = appointmentDate >= filters.dateRange.from
        } else if (filters.dateRange.to) {
          dateMatch = appointmentDate <= filters.dateRange.to
        }
      }

      // Source filter
      const sourceMatch = filters.source.length === 0 || filters.source.includes(appointment.source)

      return searchMatch && statusMatch && dateMatch && sourceMatch
    })

    setFilteredAppointments(filtered)
  }

  // Generate days for the current view
  const getDaysForView = () => {
    switch (view) {
      case "day":
        return [currentDate]
      case "week":
        return eachDayOfInterval({
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        })
      case "month":
        return eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        })
      default:
        return []
    }
  }

  const days = getDaysForView()

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, -1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
    }
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  // Handle appointment click
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsOpen(true)
  }

  // Format the navigation title based on the current view
  const getNavigationTitle = () => {
    switch (view) {
      case "day":
        return format(currentDate, "MMMM d, yyyy")
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      case "month":
        return format(currentDate, "MMMM yyyy")
      case "agenda":
        return "Agenda View"
      case "resource":
        return `Resource View: ${resourceView === "staff" ? "Staff" : resourceView === "room" ? "Room" : "Time"}`
      default:
        return ""
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, appointment) => {
    setDraggedAppointment(appointment)
    setIsDragging(true)

    // Set drag image (optional)
    if (e.dataTransfer) {
      const dragImage = document.createElement("div")
      dragImage.className = "bg-primary text-white p-2 rounded shadow"
      dragImage.textContent = `${appointment.service} - ${appointment.customer.name}`
      dragImage.style.position = "absolute"
      dragImage.style.top = "-1000px"
      document.body.appendChild(dragImage)
      e.dataTransfer.setDragImage(dragImage, 0, 0)
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)
    }
  }

  const handleDragOver = (e, date, timeSlot = null) => {
    e.preventDefault()
    if (!draggedAppointment) return

    // Set drop target
    setDropTarget({ date, timeSlot })
  }

  const handleDrop = (e, date, timeSlot = null) => {
    e.preventDefault()
    if (!draggedAppointment) return

    // Update appointment date/time
    const updatedAppointments = filteredAppointments.map((apt) => {
      if (apt.id === draggedAppointment.id) {
        const newDate = format(date, "yyyy-MM-dd")

        // If timeSlot is provided, update the time as well
        let newTime = apt.time
        if (timeSlot) {
          const hour = Math.floor(timeSlot / 60)
          const minute = timeSlot % 60
          const isPM = hour >= 12
          const displayHour = isPM ? (hour === 12 ? 12 : hour - 12) : hour === 0 ? 12 : hour
          newTime = `${displayHour}:${minute === 0 ? "00" : minute} ${isPM ? "PM" : "AM"}`
        }

        return { ...apt, date: newDate, time: newTime }
      }
      return apt
    })

    setFilteredAppointments(updatedAppointments)

    // Show success toast
    toast({
      title: "Appointment Rescheduled",
      description: `${draggedAppointment.service} with ${draggedAppointment.customer.name} has been rescheduled to ${format(date, "MMM d, yyyy")}${timeSlot ? ` at ${timeSlot}` : ""}.`,
    })

    // Reset drag state
    setDraggedAppointment(null)
    setIsDragging(false)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedAppointment(null)
    setIsDragging(false)
    setDropTarget(null)
  }

  // Export calendar handlers
  const handleExportOpen = () => {
    setIsExportOpen(true)
    setExportFormat("ical")
    setExportDateRange("visible")
    setExportCustomStartDate("")
    setExportCustomEndDate("")
    setSelectedAppointmentsForExport([])
    setExportAllAppointments(true)
  }

  const handleExportCalendar = () => {
    // Determine which appointments to export
    let appointmentsToExport = []

    if (exportAllAppointments) {
      // Export all filtered appointments
      appointmentsToExport = filteredAppointments
    } else {
      // Export only selected appointments
      appointmentsToExport = filteredAppointments.filter((apt) => selectedAppointmentsForExport.includes(apt.id))
    }

    // Apply date range filter if needed
    if (exportDateRange !== "all") {
      let startDate, endDate

      if (exportDateRange === "visible") {
        // Use the current view's date range
        if (view === "day") {
          startDate = startOfDay(currentDate)
          endDate = endOfDay(currentDate)
        } else if (view === "week") {
          startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
          endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
        } else if (view === "month") {
          startDate = startOfMonth(currentDate)
          endDate = endOfMonth(currentDate)
        }
      } else if (exportDateRange === "custom" && exportCustomStartDate && exportCustomEndDate) {
        startDate = parseISO(exportCustomStartDate)
        endDate = parseISO(exportCustomEndDate)
      }

      if (startDate && endDate) {
        appointmentsToExport = appointmentsToExport.filter((apt) => {
          const aptDate = parseISO(apt.date)
          return isWithinInterval(aptDate, { start: startDate, end: endDate })
        })
      }
    }

    // Generate filename
    const filename = `appointments_${format(new Date(), "yyyy-MM-dd")}.ics`

    // Download the calendar
    downloadCalendarAsICal(appointmentsToExport, filename)

    // Close the export dialog
    setIsExportOpen(false)

    // Show success toast
    toast({
      title: "Calendar Exported",
      description: `${appointmentsToExport.length} appointments exported as ${filename}`,
    })
  }

  // Toggle appointment selection for export
  const toggleAppointmentSelection = (appointmentId) => {
    setSelectedAppointmentsForExport((prev) => {
      if (prev.includes(appointmentId)) {
        return prev.filter((id) => id !== appointmentId)
      } else {
        return [...prev, appointmentId]
      }
    })
  }

  // Get all unique staff members
  const getUniqueStaff = () => {
    const staffSet = new Set(filteredAppointments.map((apt) => apt.staff))
    return Array.from(staffSet)
  }

  // Get all unique rooms
  const getUniqueRooms = () => {
    const roomSet = new Set(filteredAppointments.map((apt) => apt.room))
    return Array.from(roomSet)
  }

  // Render time slots for day view (for drag and drop)
  const renderTimeSlots = (date) => {
    const slots = []
    const dayAppointments = getAppointmentsForDay(date, filteredAppointments)

    // Create slots from 8 AM to 6 PM in 30-minute increments
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = hour * 60 + minute
        const isPM = hour >= 12
        const displayHour = isPM ? (hour === 12 ? 12 : hour - 12) : hour
        const timeLabel = `${displayHour}:${minute === 0 ? "00" : minute} ${isPM ? "PM" : "AM"}`

        // Check if this slot has an appointment
        const appointmentsInSlot = dayAppointments.filter((apt) => {
          const aptTimeValue = getTimeValue(apt.time)
          const aptDuration = parseDuration(apt.duration)
          return timeValue >= aptTimeValue && timeValue < aptTimeValue + aptDuration
        })

        const isDropTarget = dropTarget && isSameDay(dropTarget.date, date) && dropTarget.timeSlot === timeValue

        slots.push(
          <div
            key={`${date}-${timeValue}`}
            className={`h-12 border-b relative ${isDropTarget ? "bg-primary/20" : "hover:bg-muted/50"}`}
            onDragOver={(e) => handleDragOver(e, date, timeValue)}
            onDrop={(e) => handleDrop(e, date, timeValue)}
          >
            <div className="absolute left-0 top-0 text-xs text-muted-foreground p-1">{timeLabel}</div>

            {appointmentsInSlot.map((apt) => (
              <div
                key={apt.id}
                className={`absolute right-0 left-8 top-0 bottom-0 m-1 p-1 rounded text-xs cursor-move ${getStatusColor(
                  apt.status,
                )} ${draggedAppointment?.id === apt.id ? "opacity-50" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, apt)}
                onDragEnd={handleDragEnd}
                onClick={() => handleAppointmentClick(apt)}
              >
                <div className="font-medium truncate">{apt.service}</div>
                <div className="truncate">{apt.customer.name}</div>
              </div>
            ))}
          </div>,
        )
      }
    }

    return slots
  }

  // Render resource view (staff or room)
  const renderResourceView = () => {
    const resources = resourceView === "staff" ? getUniqueStaff() : getUniqueRooms()

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `auto repeat(${resources.length}, 1fr)` }}>
          {/* Header row with resource names */}
          <div className="bg-muted p-2 border-r font-medium">Time</div>
          {resources.map((resource) => (
            <div key={resource} className="bg-muted p-2 text-center border-r last:border-r-0 font-medium truncate">
              {resource}
            </div>
          ))}

          {/* Time slots */}
          {Array.from({ length: 20 }).map((_, i) => {
            const hour = 8 + Math.floor(i / 2)
            const minute = (i % 2) * 30
            const isPM = hour >= 12
            const displayHour = isPM ? (hour === 12 ? 12 : hour - 12) : hour
            const timeLabel = `${displayHour}:${minute === 0 ? "00" : minute} ${isPM ? "PM" : "AM"}`
            const timeValue = hour * 60 + minute

            return (
              <React.Fragment key={`time-${timeValue}`}>
                <div className="p-2 border-r border-b h-12 text-xs text-muted-foreground">{timeLabel}</div>

                {resources.map((resource) => {
                  const appointmentsInSlot = filteredAppointments.filter((apt) => {
                    const resourceMatch = resourceView === "staff" ? apt.staff === resource : apt.room === resource

                    if (!resourceMatch) return false

                    const aptDate = parseISO(apt.date)
                    if (!isSameDay(aptDate, currentDate)) return false

                    const aptTimeValue = getTimeValue(apt.time)
                    const aptDuration = parseDuration(apt.duration)
                    return timeValue >= aptTimeValue && timeValue < aptTimeValue + aptDuration
                  })

                  const isDropTarget =
                    dropTarget &&
                    isSameDay(dropTarget.date, currentDate) &&
                    dropTarget.timeSlot === timeValue &&
                    (resourceView === "staff" ? dropTarget.resource === resource : dropTarget.resource === resource)

                  return (
                    <div
                      key={`${resource}-${timeValue}`}
                      className={`p-1 border-r border-b h-12 relative ${
                        isDropTarget ? "bg-primary/20" : "hover:bg-muted/50"
                      }`}
                      onDragOver={(e) => handleDragOver(e, currentDate, timeValue, resource)}
                      onDrop={(e) => handleDrop(e, currentDate, timeValue, resource)}
                    >
                      {appointmentsInSlot.map((apt) => (
                        <div
                          key={apt.id}
                          className={`absolute inset-1 p-1 rounded text-xs cursor-move ${getStatusColor(
                            apt.status,
                          )} ${draggedAppointment?.id === apt.id ? "opacity-50" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <div className="font-medium truncate">{apt.service}</div>
                          <div className="truncate">{apt.customer.name}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  // Render agenda view
  const renderAgendaView = () => {
    // Group appointments by date
    const appointmentsByDate = {}

    filteredAppointments.forEach((apt) => {
      if (!appointmentsByDate[apt.date]) {
        appointmentsByDate[apt.date] = []
      }
      appointmentsByDate[apt.date].push(apt)
    })

    // Sort dates
    const sortedDates = Object.keys(appointmentsByDate).sort()

    return (
      <div className="border rounded-lg overflow-hidden">
        {sortedDates.length > 0 ? (
          sortedDates.map((date) => (
            <div key={date} className="border-b last:border-b-0">
              <div className="bg-muted p-3 font-medium">{format(parseISO(date), "EEEE, MMMM d, yyyy")}</div>
              <div className="divide-y">
                {appointmentsByDate[date]
                  .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time))
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 ${
                        isDragging && draggedAppointment?.id === appointment.id ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appointment)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="text-sm font-medium">{appointment.time}</div>
                        <div className="text-xs text-muted-foreground">{appointment.duration}</div>
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">{appointment.service}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {appointment.customer.name}
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {getStatusBadge(appointment.status)}
                        <div className="text-xs text-muted-foreground">
                          {appointment.staff} • {appointment.room}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">No appointments found with the current filters.</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4" ref={calendarRef}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold">{getNavigationTitle()}</h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tabs value={view} onValueChange={setView} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="resource">Resource</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={handleExportOpen}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {view === "resource" && (
        <div className="flex justify-end mb-2">
          <Select value={resourceView} onValueChange={setResourceView}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>View by Staff</span>
                </div>
              </SelectItem>
              <SelectItem value="room">
                <div className="flex items-center">
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  <span>View by Room</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <SearchFilterSystem
        onFilterChange={handleFilterChange}
        initialFilters={{
          search: "",
          status: [],
          dateRange: { from: null, to: null },
          source: [],
        }}
      />

      {view === "day" && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-4 border-b">
            <h3 className="font-medium">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
          </div>
          <div
            className="divide-y"
            onDragOver={(e) => handleDragOver(e, currentDate)}
            onDrop={(e) => handleDrop(e, currentDate)}
          >
            {renderTimeSlots(currentDate)}
          </div>
        </div>
      )}

      {view === "week" && (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-muted">
            {days.map((day) => (
              <div key={day.toString()} className="p-2 text-center border-r last:border-r-0">
                <div className="font-medium">{format(day, "EEE")}</div>
                <div className="text-sm">{format(day, "MMM d")}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x h-[600px]">
            {days.map((day) => (
              <div
                key={day.toString()}
                className="overflow-y-auto"
                onDragOver={(e) => handleDragOver(e, day)}
                onDrop={(e) => handleDrop(e, day)}
              >
                {getAppointmentsForDay(day, filteredAppointments).map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`m-1 p-2 rounded border-l-4 text-sm cursor-move ${getStatusColor(
                      appointment.status,
                    )} ${draggedAppointment?.id === appointment.id ? "opacity-50" : ""}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, appointment)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAppointmentClick(appointment)}
                  >
                    <div className="font-medium">{appointment.time}</div>
                    <div className="font-medium truncate">{appointment.service}</div>
                    <div className="truncate">{appointment.customer.name}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="p-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y">
            {days.map((day, i) => {
              const dayAppointments = getAppointmentsForDay(day, filteredAppointments)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[100px] p-1 ${isCurrentMonth ? "" : "bg-muted/30"}`}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="text-right p-1">
                    <span className={`text-sm ${isCurrentMonth ? "font-medium" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.length > 0
                      ? dayAppointments.slice(0, 3).map((appointment) => (
                          <div
                            key={appointment.id}
                            className={`px-2 py-1 text-xs rounded truncate cursor-move ${getStatusColor(
                              appointment.status,
                            )} ${draggedAppointment?.id === appointment.id ? "opacity-50" : ""}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, appointment)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            {appointment.time} - {appointment.customer.name}
                          </div>
                        ))
                      : null}
                    {dayAppointments.length > 3 && (
                      <div className="px-2 py-1 text-xs text-center text-muted-foreground">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === "agenda" && renderAgendaView()}

      {view === "resource" && renderResourceView()}

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
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Staff</h4>
                  <p>{selectedAppointment.staff}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Room</h4>
                  <p>{selectedAppointment.room}</p>
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

      {/* Export Calendar Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Calendar</DialogTitle>
            <DialogDescription>Export your appointments to calendar format</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ical" id="ical" />
                  <Label htmlFor="ical" className="flex items-center cursor-pointer">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    iCalendar (.ics)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv-export" />
                  <Label htmlFor="csv-export" className="flex items-center cursor-pointer">
                    <FileText className="mr-2 h-4 w-4 text-green-600" />
                    CSV (Comma Separated Values)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <RadioGroup
                value={exportDateRange}
                onValueChange={setExportDateRange}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-dates" />
                  <Label htmlFor="all-dates" className="cursor-pointer">
                    All Appointments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible" id="visible-dates" />
                  <Label htmlFor="visible-dates" className="cursor-pointer">
                    Current View (
                    {view === "day" ? "Day" : view === "week" ? "Week" : view === "month" ? "Month" : "Custom"})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-dates" />
                  <Label htmlFor="custom-dates" className="cursor-pointer">
                    Custom Range
                  </Label>
                </div>

                {exportDateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2 pl-6 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="export-start-date" className="text-sm">
                        Start Date
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="export-start-date"
                          type="date"
                          className="pl-8"
                          value={exportCustomStartDate}
                          onChange={(e) => setExportCustomStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="export-end-date" className="text-sm">
                        End Date
                      </Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="export-end-date"
                          type="date"
                          className="pl-8"
                          value={exportCustomEndDate}
                          onChange={(e) => setExportCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Appointments to Export</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-all"
                    checked={exportAllAppointments}
                    onCheckedChange={(checked) => setExportAllAppointments(checked as boolean)}
                  />
                  <Label htmlFor="export-all" className="cursor-pointer">
                    Export All Filtered Appointments
                  </Label>
                </div>
              </div>

              {!exportAllAppointments && (
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((apt) => (
                      <div key={apt.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`apt-${apt.id}`}
                          checked={selectedAppointmentsForExport.includes(apt.id)}
                          onCheckedChange={() => toggleAppointmentSelection(apt.id)}
                        />
                        <Label htmlFor={`apt-${apt.id}`} className="cursor-pointer">
                          {apt.date} {apt.time} - {apt.service} with {apt.customer.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">No appointments match your current filters</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCalendar}>
              <Download className="mr-2 h-4 w-4" />
              Export Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

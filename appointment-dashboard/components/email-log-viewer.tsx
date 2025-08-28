"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { DataExportDialog } from "@/components/data-export-dialog"

// Mock data for email logs
const emailLogs = [
  {
    id: "EMAIL-1001",
    appointmentId: "APT-1001",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
    },
    type: "confirmation",
    status: "sent",
    sentAt: "2025-05-05T14:30:00",
    attempts: 1,
    subject: "Appointment Confirmation: Dental Checkup on May 7th",
    content: `
Dear Sarah Johnson,

This email confirms your appointment for a Dental Checkup on May 7th, 2025 at 09:30 AM.

Appointment Details:
- Service: Dental Checkup
- Date: May 7th, 2025
- Time: 09:30 AM
- Duration: 45 minutes

Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1002",
    appointmentId: "APT-1002",
    customer: {
      name: "Michael Chen",
      email: "m.chen@example.com",
    },
    type: "confirmation",
    status: "failed",
    sentAt: "2025-05-06T09:45:00",
    attempts: 2,
    error: "Mailbox full",
    subject: "Appointment Confirmation: Tax Consultation on May 7th",
    content: `
Dear Michael Chen,

This email confirms your appointment for a Tax Consultation on May 7th, 2025 at 11:00 AM.

Appointment Details:
- Service: Tax Consultation
- Date: May 7th, 2025
- Time: 11:00 AM
- Duration: 60 minutes

Please bring all relevant tax documents to your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1003",
    appointmentId: "APT-1003",
    customer: {
      name: "Emma Wilson",
      email: "emma.w@example.com",
    },
    type: "confirmation",
    status: "sent",
    sentAt: "2025-05-06T11:50:00",
    attempts: 1,
    subject: "Appointment Confirmation: Hair Styling on May 7th",
    content: `
Dear Emma Wilson,

This email confirms your appointment for Hair Styling on May 7th, 2025 at 02:15 PM.

Appointment Details:
- Service: Hair Styling
- Date: May 7th, 2025
- Time: 02:15 PM
- Duration: 90 minutes

Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1004",
    appointmentId: "APT-1004",
    customer: {
      name: "James Rodriguez",
      email: "j.rodriguez@example.com",
    },
    type: "confirmation",
    status: "pending",
    sentAt: null,
    attempts: 0,
    subject: "Appointment Confirmation: Legal Consultation on May 8th",
    content: `
Dear James Rodriguez,

This email confirms your appointment for a Legal Consultation on May 8th, 2025 at 10:00 AM.

Appointment Details:
- Service: Legal Consultation
- Date: May 8th, 2025
- Time: 10:00 AM
- Duration: 60 minutes

Please bring all relevant documents to your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1005",
    appointmentId: "APT-1005",
    customer: {
      name: "Olivia Taylor",
      email: "o.taylor@example.com",
    },
    type: "cancellation",
    status: "sent",
    sentAt: "2025-05-06T15:20:00",
    attempts: 1,
    subject: "Appointment Cancellation: Therapy Session on May 8th",
    content: `
Dear Olivia Taylor,

This email confirms the cancellation of your Therapy Session appointment scheduled for May 8th, 2025 at 03:30 PM.

If you would like to reschedule, please contact us at your convenience.

Thank you for your understanding.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1006",
    appointmentId: "APT-1006",
    customer: {
      name: "David Kim",
      email: "d.kim@example.com",
    },
    type: "confirmation",
    status: "failed",
    sentAt: "2025-05-06T16:10:00",
    attempts: 3,
    error: "Invalid email address",
    subject: "Appointment Confirmation: Financial Planning on May 9th",
    content: `
Dear David Kim,

This email confirms your appointment for Financial Planning on May 9th, 2025 at 01:00 PM.

Appointment Details:
- Service: Financial Planning
- Date: May 9th, 2025
- Time: 01:00 PM
- Duration: 75 minutes

Please bring all relevant financial documents to your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
  {
    id: "EMAIL-1007",
    appointmentId: "APT-1007",
    customer: {
      name: "Lisa Wang",
      email: "l.wang@example.com",
    },
    type: "reminder",
    status: "sent",
    sentAt: "2025-05-09T11:30:00",
    attempts: 1,
    subject: "Appointment Reminder: Physical Therapy on May 10th",
    content: `
Dear Lisa Wang,

This is a friendly reminder of your upcoming appointment for Physical Therapy on May 10th, 2025 at 11:30 AM.

Appointment Details:
- Service: Physical Therapy
- Date: May 10th, 2025
- Time: 11:30 AM
- Duration: 60 minutes

Please arrive 10 minutes before your scheduled appointment time. If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Thank you for choosing our services.

Best regards,
AppointmentHub Team
    `,
  },
]

export function EmailLogViewer() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [isEmailDetailsOpen, setIsEmailDetailsOpen] = useState(false)

  // Filter email logs based on search query and filters
  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.appointmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    const matchesType = typeFilter === "all" || log.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Handle retry sending email
  const handleRetryEmail = (emailId) => {
    // In a real application, this would call an API to retry sending the email
    // For this demo, we'll just show a success toast
    toast({
      title: "Email Sent Successfully",
      description: "The email has been resent to the customer.",
    })
  }

  // Handle export
  const handleExport = (format, options) => {
    console.log("Exporting email logs:", format, options)
    // In a real application, this would call an API to export the data
  }

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" /> Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Get type badge
  const getTypeBadge = (type) => {
    switch (type) {
      case "confirmation":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Confirmation
          </Badge>
        )
      case "reminder":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Reminder
          </Badge>
        )
      case "cancellation":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancellation
          </Badge>
        )
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <select
            className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="confirmation">Confirmation</option>
            <option value="reminder">Reminder</option>
            <option value="cancellation">Cancellation</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
              setTypeFilter("all")
            }}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <DataExportDialog dataType="emails" count={filteredLogs.length} onExport={handleExport} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email ID</TableHead>
              <TableHead>Appointment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell>{log.appointmentId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.customer.name}</div>
                      <div className="text-sm text-muted-foreground">{log.customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(log.type)}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {log.sentAt ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a") : "Not sent yet"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEmail(log)
                          setIsEmailDetailsOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {log.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRetryEmail(log.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No email logs found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{currentItems.length}</strong> of <strong>{filteredLogs.length}</strong> email logs
          {filteredLogs.length !== emailLogs.length && <span> (filtered from {emailLogs.length} total)</span>}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => paginate(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedEmail && (
        <Dialog open={isEmailDetailsOpen} onOpenChange={setIsEmailDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email ID</div>
                  <div>{selectedEmail.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Appointment ID</div>
                  <div>{selectedEmail.appointmentId}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Customer</div>
                  <div>{selectedEmail.customer.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedEmail.customer.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedEmail.status)}
                    {selectedEmail.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => handleRetryEmail(selectedEmail.id)}
                      >
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Type</div>
                  <div>{getTypeBadge(selectedEmail.type)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sent At</div>
                  <div>
                    {selectedEmail.sentAt
                      ? format(new Date(selectedEmail.sentAt), "MMM d, yyyy h:mm a")
                      : "Not sent yet"}
                  </div>
                </div>
              </div>

              {selectedEmail.attempts > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Attempts</div>
                  <div>{selectedEmail.attempts}</div>
                </div>
              )}

              {selectedEmail.error && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Error</div>
                  <div className="text-red-500">{selectedEmail.error}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground">Subject</div>
                <div>{selectedEmail.subject}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Content</div>
                <div className="mt-2 p-4 border rounded-md bg-muted/50 whitespace-pre-line">
                  {selectedEmail.content}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEmailDetailsOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

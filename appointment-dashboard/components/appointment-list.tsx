"use client";

import { useState } from "react";
import { isWithinInterval, parseISO } from "date-fns";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Download,
  BarChart,
  User,
  Phone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import {
  SearchFilterSystem,
  type FilterValue,
} from "@/components/search-filter-system";
import { toast } from "@/components/ui/use-toast";
import { DataExportDialog } from "@/components/data-export-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Utility function to format phone numbers consistently
const formatPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return "N/A";

  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Check if we have a valid 10-digit number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // Handle numbers with country code 1
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(
      7
    )}`;
  }

  // If the number doesn't match expected formats, return it as is
  return phoneNumber;
};

// Mock data based on the provided JSON structure
const callSessions = [
  {
    session_id: "call-1001-2025-05-05",
    customer_id: "cus_1234567890",
    timestamp_utc: "2025-05-05T12:08:12Z",
    caller_info: {
      name: "Abdulah",
      email: "adulamansul@gmail.com",
      phone: null,
      avatar: "/stylized-letters-sj.png",
    },
    appointment: {
      scheduled: true,
      datetime: "2025-05-06T14:00:00Z",
      duration_minutes: 30,
      timezone: "UTC",
    },
    conversation_metrics: {
      total_turns: 35,
      user_turns: 7,
      assistant_turns: 28,
      duration_seconds: 312,
      user_affirmations: 4,
      interruptions: 1,
      booking_successful: true,
      disengagement: false,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content: "My name is Abdulah.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-05T12:08:12Z",
        event: "WebSocket connected",
        source: "twilio",
      },
      {
        timestamp: "2025-05-05T12:12:48Z",
        event: "Booking created",
        metadata: {
          slot: "2025-05-06T14:00:00Z",
          email: "adulamansul@gmail.com",
        },
      },
    ],
    call_outcome: {
      lead_status: "Booked",
      engagement_score: 0.92,
      summary:
        "User showed interest in AI sales automation and booked a demo for May 6, 2025, at 2 PM UTC.",
    },
  },
  {
    session_id: "call-1002-2025-05-05",
    customer_id: "cus_2345678901",
    timestamp_utc: "2025-05-05T13:15:22Z",
    caller_info: {
      name: "Michael Chen",
      email: "m.chen@example.com",
      phone: "5552345678",
      avatar: "/microphone-concert-stage.png",
    },
    appointment: {
      scheduled: true,
      datetime: "2025-05-07T11:00:00Z",
      duration_minutes: 60,
      timezone: "America/New_York",
    },
    conversation_metrics: {
      total_turns: 42,
      user_turns: 12,
      assistant_turns: 30,
      duration_seconds: 425,
      user_affirmations: 6,
      interruptions: 0,
      booking_successful: true,
      disengagement: false,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content: "Hi, I'm interested in tax consultation services.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-05T13:15:22Z",
        event: "WebSocket connected",
        source: "twilio",
      },
      {
        timestamp: "2025-05-05T13:22:48Z",
        event: "Booking created",
        metadata: {
          slot: "2025-05-07T11:00:00Z",
          email: "m.chen@example.com",
        },
      },
    ],
    call_outcome: {
      lead_status: "Booked",
      engagement_score: 0.88,
      summary:
        "Client needs help with small business taxes and booked a consultation.",
    },
  },
  {
    session_id: "call-1003-2025-05-05",
    customer_id: "cus_3456789012",
    timestamp_utc: "2025-05-05T14:30:45Z",
    caller_info: {
      name: "Emma Wilson",
      email: "emma.w@example.com",
      phone: "5553456789",
      avatar: "/graffiti-ew.png",
    },
    appointment: {
      scheduled: true,
      datetime: "2025-05-07T14:15:00Z",
      duration_minutes: 90,
      timezone: "America/Los_Angeles",
    },
    conversation_metrics: {
      total_turns: 38,
      user_turns: 10,
      assistant_turns: 28,
      duration_seconds: 380,
      user_affirmations: 5,
      interruptions: 2,
      booking_successful: true,
      disengagement: false,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content: "I'd like to book a hair styling appointment.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-05T14:30:45Z",
        event: "WebSocket connected",
        source: "twilio",
      },
      {
        timestamp: "2025-05-05T14:37:12Z",
        event: "Booking created",
        metadata: {
          slot: "2025-05-07T14:15:00Z",
          email: "emma.w@example.com",
        },
      },
    ],
    call_outcome: {
      lead_status: "Booked",
      engagement_score: 0.91,
      summary:
        "Client booked a hair styling appointment and requested same style as previous visit.",
    },
  },
  {
    session_id: "call-1004-2025-05-06",
    customer_id: "cus_4567890123",
    timestamp_utc: "2025-05-06T09:45:30Z",
    caller_info: {
      name: "James Rodriguez",
      email: "j.rodriguez@example.com",
      phone: "5554567890",
      avatar: "/stylized-jr-logo.png",
    },
    appointment: {
      scheduled: true,
      datetime: "2025-05-08T10:00:00Z",
      duration_minutes: 60,
      timezone: "America/Chicago",
    },
    conversation_metrics: {
      total_turns: 30,
      user_turns: 8,
      assistant_turns: 22,
      duration_seconds: 285,
      user_affirmations: 3,
      interruptions: 0,
      booking_successful: true,
      disengagement: false,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content: "I need a legal consultation for contract review.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-06T09:45:30Z",
        event: "WebSocket connected",
        source: "website",
      },
      {
        timestamp: "2025-05-06T09:50:12Z",
        event: "Booking created",
        metadata: {
          slot: "2025-05-08T10:00:00Z",
          email: "j.rodriguez@example.com",
        },
      },
    ],
    call_outcome: {
      lead_status: "Booked",
      engagement_score: 0.85,
      summary:
        "Client needs legal consultation for contract review for new business.",
    },
  },
  {
    session_id: "call-1005-2025-05-06",
    customer_id: "cus_5678901234",
    timestamp_utc: "2025-05-06T11:20:15Z",
    caller_info: {
      name: "Olivia Taylor",
      email: "o.taylor@example.com",
      phone: "5555678901",
      avatar: "/abstract-ot.png",
    },
    appointment: {
      scheduled: false,
      datetime: null,
      duration_minutes: null,
      timezone: null,
    },
    conversation_metrics: {
      total_turns: 25,
      user_turns: 6,
      assistant_turns: 19,
      duration_seconds: 210,
      user_affirmations: 2,
      interruptions: 1,
      booking_successful: false,
      disengagement: true,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content:
          "I was interested in a therapy session but I'm not feeling well today.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-06T11:20:15Z",
        event: "WebSocket connected",
        source: "phone",
      },
      {
        timestamp: "2025-05-06T11:23:45Z",
        event: "Call ended",
        metadata: {
          reason: "user_disconnected",
        },
      },
    ],
    call_outcome: {
      lead_status: "Not Booked",
      engagement_score: 0.65,
      summary:
        "Client was interested in therapy session but cancelled due to illness. Follow up recommended.",
    },
  },
  {
    session_id: "call-1006-2025-05-06",
    customer_id: "cus_6789012345",
    timestamp_utc: "2025-05-06T13:10:40Z",
    caller_info: {
      name: "David Kim",
      email: "d.kim@example.com",
      phone: "5556789012",
      avatar: "/abstract-geometric-dk.png",
    },
    appointment: {
      scheduled: true,
      datetime: "2025-05-09T13:00:00Z",
      duration_minutes: 75,
      timezone: "America/New_York",
    },
    conversation_metrics: {
      total_turns: 45,
      user_turns: 15,
      assistant_turns: 30,
      duration_seconds: 450,
      user_affirmations: 7,
      interruptions: 3,
      booking_successful: true,
      disengagement: false,
    },
    conversation_log: [
      {
        type: "ConversationText",
        role: "assistant",
        content: "Hello! I'm Sarah, AI Agent at Beruni Labs. ...",
      },
      {
        type: "ConversationText",
        role: "user",
        content:
          "I'd like to discuss financial planning options with my spouse.",
      },
    ],
    system_events: [
      {
        timestamp: "2025-05-06T13:10:40Z",
        event: "WebSocket connected",
        source: "email",
      },
      {
        timestamp: "2025-05-06T13:18:22Z",
        event: "Booking created",
        metadata: {
          slot: "2025-05-09T13:00:00Z",
          email: "d.kim@example.com",
        },
      },
    ],
    call_outcome: {
      lead_status: "Booked",
      engagement_score: 0.89,
      summary: "Client and spouse want to discuss retirement planning options.",
    },
  },
];

export function UserInformationPanel() {
  const router = useRouter();
  const { workspace } = useParams();
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState(callSessions);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [localSessions, setLocalSessions] = useState(callSessions);

  // Handle filter changes
  const handleFilterChange = (filters: FilterValue) => {
    const filtered = localSessions.filter((session) => {
      // Search filter
      const searchMatch =
        !filters.search ||
        session.caller_info.name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        session.caller_info.email
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        session.session_id
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        session.customer_id
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (session.caller_info.phone &&
          session.caller_info.phone
            .replace(/\D/g, "")
            .includes(filters.search.replace(/\D/g, "")));

      // Status filter - map to lead_status
      const statusMatch =
        filters.status.length === 0 ||
        (session.call_outcome.lead_status === "Booked" &&
          filters.status.includes("confirmed")) ||
        (session.call_outcome.lead_status === "Not Booked" &&
          filters.status.includes("cancelled"));

      // Date range filter
      let dateMatch = true;
      if (filters.dateRange.from || filters.dateRange.to) {
        const sessionDate = parseISO(session.timestamp_utc);

        if (filters.dateRange.from && filters.dateRange.to) {
          dateMatch = isWithinInterval(sessionDate, {
            start: filters.dateRange.from,
            end: filters.dateRange.to,
          });
        } else if (filters.dateRange.from) {
          dateMatch = sessionDate >= filters.dateRange.from;
        } else if (filters.dateRange.to) {
          dateMatch = sessionDate <= filters.dateRange.to;
        }
      }

      // Source filter - from system_events
      const sourceMatch =
        filters.source.length === 0 ||
        filters.source.includes(session.system_events[0].source);

      return searchMatch && statusMatch && dateMatch && sourceMatch;
    });

    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  const handleViewConversation = (sessionId) => {
    if (sessionId) {
      router.push(`/${workspace}/chat-logs?conversation=${sessionId}`);
    } else {
      toast({
        title: "No Conversation Available",
        description:
          "There is no chat conversation associated with this session.",
        variant: "destructive",
      });
    }
  };

  // Get status badge
  const getStatusBadge = (leadStatus) => {
    switch (leadStatus) {
      case "Booked":
        return <Badge className="bg-green-500 text-nowrap">Booked</Badge>;
      case "Not Booked":
        return <Badge variant="destructive" className="text-nowrap">Not Booked</Badge>;
      default:
        return <Badge variant="secondary" className="text-nowrap">{leadStatus}</Badge>;
    }
  };

  // Get engagement score badge
  const getEngagementBadge = (score) => {
    if (score >= 0.9) {
      return (
        <Badge className="bg-green-500">{(score * 100).toFixed(0)}%</Badge>
      );
    } else if (score >= 0.7) {
      return <Badge className="bg-blue-500">{(score * 100).toFixed(0)}%</Badge>;
    } else if (score >= 0.5) {
      return (
        <Badge variant="outline" className="text-amber-500 border-amber-500">
          {(score * 100).toFixed(0)}%
        </Badge>
      );
    } else {
      return <Badge variant="destructive">{(score * 100).toFixed(0)}%</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Format duration for display
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle export
  const handleExport = (format, options) => {
    console.log("Exporting data:", format, options);
    // In a real application, this would call an API to export the data
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSessions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <SearchFilterSystem
            onFilterChange={handleFilterChange}
            placeholder="Search by name, email, phone, or ID..."
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <DataExportDialog
            dataType="sessions"
            count={filteredSessions.length}
            onExport={handleExport}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Caller Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Timestamp (UTC)</TableHead>
              <TableHead>Appointment</TableHead>
              <TableHead>Lead Status</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell className="font-medium text-nowrap">
                    {session.session_id}
                  </TableCell>
                  <TableCell>{session.customer_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={session.caller_info.avatar || "/placeholder.svg"}
                        alt={session.caller_info.name}
                        className="h-8 w-8 rounded-full"
                      />
                      <div className="font-medium">
                        {session.caller_info.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.caller_info.email}</TableCell>
                  <TableCell className="text-nowrap">
                    {formatPhoneNumber(session.caller_info.phone)}
                  </TableCell>
                  <TableCell>{formatDate(session.timestamp_utc)}</TableCell>
                  <TableCell>
                    {session.appointment.scheduled ? (
                      <div>
                        <div>{formatDate(session.appointment.datetime)}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.appointment.duration_minutes} min (
                          {session.appointment.timezone})
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Not scheduled
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(session.call_outcome.lead_status)}
                  </TableCell>
                  <TableCell>
                    {getEngagementBadge(session.call_outcome.engagement_score)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {session.system_events[0].source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setTimeout(() => {
                              handleViewDetails(session);
                            }, 100)
                          }
                        >
                          <BarChart className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleViewConversation(session.session_id)
                          }
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View Conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        {session.caller_info.phone && (
                          <DropdownMenuItem>
                            <Phone className="mr-2 h-4 w-4" />
                            Call User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  No sessions found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{currentItems.length}</strong> of{" "}
          <strong>{filteredSessions.length}</strong> sessions
          {filteredSessions.length !== localSessions.length && (
            <span> (filtered from {localSessions.length} total)</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
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

      {selectedSession && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Call Session Details</DialogTitle>
              <DialogDescription>
                Complete information about session {selectedSession.session_id}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Conversation Metrics</TabsTrigger>
                <TabsTrigger value="events">System Events</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedSession.caller_info.avatar || "/placeholder.svg"
                    }
                    alt={selectedSession.caller_info.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">
                      {selectedSession.caller_info.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.caller_info.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneNumber(selectedSession.caller_info.phone)}
                    </p>
                  </div>
                  {getStatusBadge(selectedSession.call_outcome.lead_status)}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Customer ID
                    </h4>
                    <p>{selectedSession.customer_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Session ID
                    </h4>
                    <p>{selectedSession.session_id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Call Start Time
                    </h4>
                    <p>{formatDate(selectedSession.timestamp_utc)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Call Duration
                    </h4>
                    <p>
                      {formatDuration(
                        selectedSession.conversation_metrics.duration_seconds
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Source
                    </h4>
                    <p className="capitalize">
                      {selectedSession.system_events[0].source}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Engagement Score
                    </h4>
                    <p>
                      {getEngagementBadge(
                        selectedSession.call_outcome.engagement_score
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Appointment Details
                  </h4>
                  {selectedSession.appointment.scheduled ? (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs text-muted-foreground">
                          Date & Time
                        </h5>
                        <p>
                          {formatDate(selectedSession.appointment.datetime)}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-xs text-muted-foreground">
                          Duration
                        </h5>
                        <p>
                          {selectedSession.appointment.duration_minutes} minutes
                        </p>
                      </div>
                      <div>
                        <h5 className="text-xs text-muted-foreground">
                          Timezone
                        </h5>
                        <p>{selectedSession.appointment.timezone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">
                      No appointment scheduled
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Call Outcome
                  </h4>
                  <p className="mt-2">{selectedSession.call_outcome.summary}</p>
                </div>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Total Turns
                    </h4>
                    <p>{selectedSession.conversation_metrics.total_turns}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      User Turns
                    </h4>
                    <p>{selectedSession.conversation_metrics.user_turns}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Assistant Turns
                    </h4>
                    <p>
                      {selectedSession.conversation_metrics.assistant_turns}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Duration
                    </h4>
                    <p>
                      {formatDuration(
                        selectedSession.conversation_metrics.duration_seconds
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      User Affirmations
                    </h4>
                    <p>
                      {selectedSession.conversation_metrics.user_affirmations}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Interruptions
                    </h4>
                    <p>{selectedSession.conversation_metrics.interruptions}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Booking Successful
                    </h4>
                    <p>
                      {selectedSession.conversation_metrics.booking_successful
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Disengagement
                    </h4>
                    <p>
                      {selectedSession.conversation_metrics.disengagement
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Conversation Preview
                  </h4>
                  <div className="mt-2 max-h-40 overflow-y-auto rounded border p-2">
                    {selectedSession.conversation_log.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-2 ${
                          message.role === "assistant" ? "pl-4" : "pl-0"
                        }`}
                      >
                        <span className="font-medium">
                          {message.role === "assistant"
                            ? "AI Agent: "
                            : "User: "}
                        </span>
                        {message.content}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      handleViewConversation(selectedSession.session_id)
                    }
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Full Conversation
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <div className="max-h-60 overflow-y-auto rounded border p-2">
                  {selectedSession.system_events.map((event, index) => (
                    <div
                      key={index}
                      className="mb-3 border-b pb-2 last:border-0"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{event.event}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      {event.source && (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">
                            Source:{" "}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {event.source}
                          </Badge>
                        </div>
                      )}
                      {event.metadata && (
                        <div className="mt-1 text-sm">
                          <span className="text-muted-foreground">
                            Metadata:{" "}
                          </span>
                          <pre className="mt-1 rounded bg-muted p-1 text-xs">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="sm:w-auto w-full"
                onClick={() => setIsDetailsOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                className="sm:w-auto w-full"
                onClick={() =>
                  router.push(
                    `/${workspace}/chat-logs?conversation=${selectedSession.session_id}`
                  )
                }
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                View Conversation
              </Button>
              <Button
                variant="default"
                className="sm:w-auto w-full"
                onClick={() => {
                  toast({
                    title: "Export Session",
                    description: `Exporting session ${selectedSession.session_id}`,
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Bot, User, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useParams, useRouter } from "next/navigation"

// Mock conversation data
const mockConversations = [
  {
    id: "CONV-1001",
    appointmentId: "APT-1001",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 123-4567",
      avatar: "/stylized-letters-sj.png",
    },
    date: "2025-05-05",
    time: "14:23:45",
    messages: [
      {
        id: "msg-1",
        sender: "bot",
        content: "Hello! Welcome to our appointment booking service. How can I help you today?",
        timestamp: "2025-05-05T14:23:45",
      },
      {
        id: "msg-2",
        sender: "user",
        content: "Hi, I'd like to book a dental checkup.",
        timestamp: "2025-05-05T14:24:12",
      },
      {
        id: "msg-3",
        sender: "bot",
        content: "Great! I can help you with that. Do you have a preferred date for your dental checkup?",
        timestamp: "2025-05-05T14:24:30",
      },
      {
        id: "msg-4",
        sender: "user",
        content: "Yes, I was hoping to come in on May 7th in the morning if possible.",
        timestamp: "2025-05-05T14:25:05",
      },
      {
        id: "msg-5",
        sender: "bot",
        content:
          "Let me check the availability for May 7th morning. We have the following slots available: 9:00 AM, 9:30 AM, and 10:45 AM. Which one would you prefer?",
        timestamp: "2025-05-05T14:25:25",
      },
      {
        id: "msg-6",
        sender: "user",
        content: "9:30 AM works for me.",
        timestamp: "2025-05-05T14:25:50",
      },
      {
        id: "msg-7",
        sender: "bot",
        content:
          "Perfect! I've reserved 9:30 AM on May 7th for your dental checkup. Could you please provide your full name, email address, and phone number for the booking?",
        timestamp: "2025-05-05T14:26:10",
      },
      {
        id: "msg-8",
        sender: "user",
        content: "Sure, my name is Sarah Johnson, email is sarah.j@example.com, and phone is (555) 123-4567.",
        timestamp: "2025-05-05T14:26:45",
      },
      {
        id: "msg-9",
        sender: "bot",
        content:
          "Thank you, Sarah. Is there anything specific you'd like to mention about your appointment or any concerns you have?",
        timestamp: "2025-05-05T14:27:05",
      },
      {
        id: "msg-10",
        sender: "user",
        content: "Yes, I've been experiencing some sensitivity in my upper right molar.",
        timestamp: "2025-05-05T14:27:40",
      },
      {
        id: "msg-11",
        sender: "bot",
        content:
          "I've noted that you're experiencing sensitivity in your upper right molar. Your appointment is now confirmed for May 7th at 9:30 AM. You'll receive a confirmation email shortly. Is there anything else you need help with?",
        timestamp: "2025-05-05T14:28:10",
      },
      {
        id: "msg-12",
        sender: "user",
        content: "No, that's all. Thank you!",
        timestamp: "2025-05-05T14:28:30",
      },
      {
        id: "msg-13",
        sender: "bot",
        content: "You're welcome, Sarah! We look forward to seeing you on May 7th at 9:30 AM. Have a great day!",
        timestamp: "2025-05-05T14:28:45",
      },
    ],
    source: "chatbot",
  },
  {
    id: "CONV-1002",
    appointmentId: "APT-1002",
    customer: {
      name: "Michael Chen",
      email: "m.chen@example.com",
      phone: "(555) 234-5678",
      avatar: "/microphone-concert-stage.png",
    },
    date: "2025-05-06",
    time: "09:15:22",
    messages: [
      {
        id: "msg-1",
        sender: "bot",
        content: "Hello! Welcome to our appointment booking service. How can I help you today?",
        timestamp: "2025-05-06T09:15:22",
      },
      {
        id: "msg-2",
        sender: "user",
        content: "Hi, I need to schedule a tax consultation for my small business.",
        timestamp: "2025-05-06T09:15:45",
      },
      {
        id: "msg-3",
        sender: "bot",
        content: "I'd be happy to help you schedule a tax consultation. Do you have a specific date in mind?",
        timestamp: "2025-05-06T09:16:05",
      },
      {
        id: "msg-4",
        sender: "user",
        content: "I was thinking sometime this week if possible.",
        timestamp: "2025-05-06T09:16:30",
      },
      {
        id: "msg-5",
        sender: "bot",
        content:
          "Let me check our availability for this week. We have openings on May 7th at 11:00 AM, May 8th at 2:00 PM, or May 9th at 10:00 AM. Which would work best for you?",
        timestamp: "2025-05-06T09:16:55",
      },
      {
        id: "msg-6",
        sender: "user",
        content: "May 7th at 11:00 AM would be perfect.",
        timestamp: "2025-05-06T09:17:20",
      },
    ],
    source: "chatbot",
  },
  {
    id: "CONV-1003",
    appointmentId: "APT-1003",
    customer: {
      name: "Emma Wilson",
      email: "emma.w@example.com",
      phone: "(555) 345-6789",
      avatar: "/graffiti-ew.png",
    },
    date: "2025-05-06",
    time: "11:42:10",
    messages: [
      {
        id: "msg-1",
        sender: "bot",
        content: "Hello! Welcome to our appointment booking service. How can I help you today?",
        timestamp: "2025-05-06T11:42:10",
      },
      {
        id: "msg-2",
        sender: "user",
        content: "Hi there, I'd like to book a hair styling appointment.",
        timestamp: "2025-05-06T11:42:35",
      },
      {
        id: "msg-3",
        sender: "bot",
        content:
          "I'd be happy to help you book a hair styling appointment. Do you have a specific date and time in mind?",
        timestamp: "2025-05-06T11:42:55",
      },
      {
        id: "msg-4",
        sender: "user",
        content: "I was hoping to come in tomorrow afternoon if possible.",
        timestamp: "2025-05-06T11:43:20",
      },
    ],
    source: "chatbot",
  },
]

export function DashboardChatLogs() {
  const router = useRouter()
    const { workspace } = useParams();

  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Get the most recent conversations (limited to 5)
  const recentConversations = [...mockConversations]
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, "MMM d, yyyy h:mm a")
  }

  const handleViewConversation = (conversation: any) => {
    setSelectedConversation(conversation)
    setIsDetailsOpen(true)
  }

  const handleViewAllChatLogs = () => {
    router.push(`/${workspace}/chat-logs`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Chat Conversations</CardTitle>
            <CardDescription>Latest customer interactions with the AI chatbot</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewAllChatLogs}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => handleViewConversation(conversation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={conversation.customer.avatar || "/placeholder.svg"}
                    alt={conversation.customer.name}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{conversation.customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(`${conversation.date}T${conversation.time}`), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{conversation.appointmentId}</Badge>
              </div>
              <div className="mt-2 text-sm line-clamp-2">
                {conversation.messages[conversation.messages.length - 1].content}
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {conversation.messages.length} messages
              </div>
            </div>
          ))}
        </div>

        {selectedConversation && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Conversation with {selectedConversation.customer.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedConversation.customer.avatar || "/placeholder.svg"}
                      alt={selectedConversation.customer.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{selectedConversation.customer.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedConversation.customer.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{selectedConversation.appointmentId}</Badge>
                </div>

                <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto space-y-4">
                  {selectedConversation.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === "bot" ? "justify-start" : "justify-end"}`}
                    >
                      {message.sender === "bot" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "bot" ? "bg-muted" : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.sender === "bot" ? "text-muted-foreground" : "text-primary-foreground/80"
                          }`}
                        >
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                      {message.sender === "user" && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleViewAllChatLogs}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All Chat Logs
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Clock, Filter } from "lucide-react"

// Mock activity data
const activityData = [
  {
    id: "act_001",
    type: "login",
    description: "Logged in from Chrome on Windows",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    ip: "192.168.1.1",
  },
  {
    id: "act_002",
    type: "profile_update",
    description: "Updated profile information",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    changes: ["name", "phone"],
  },
  {
    id: "act_003",
    type: "password_change",
    description: "Changed account password",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: "act_004",
    type: "login",
    description: "Logged in from Mobile App on iPhone",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    ip: "192.168.1.2",
  },
  {
    id: "act_005",
    type: "settings_update",
    description: "Updated notification preferences",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    changes: ["email_notifications", "sms_notifications"],
  },
]

export function ActivityTab() {
  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "Just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a")
    }
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case "login":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Login
          </Badge>
        )
      case "profile_update":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
            Profile Update
          </Badge>
        )
      case "password_change":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Password Change
          </Badge>
        )
      case "settings_update":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            Settings Update
          </Badge>
        )
      default:
        return <Badge variant="outline">Activity</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Recent Activity</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Your recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {activityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{activity.description}</p>
                      {getActivityBadge(activity.type)}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatActivityTime(activity.timestamp)}</span>
                  </div>

                  {activity.ip && <p className="text-sm text-muted-foreground">IP Address: {activity.ip}</p>}

                  {activity.changes && (
                    <p className="text-sm text-muted-foreground">Changed: {activity.changes.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline">Load More Activity</Button>
      </div>
    </div>
  )
}

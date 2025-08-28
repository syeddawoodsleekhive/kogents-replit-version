"use client"

import { useUsers } from "@/components/user-management/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Mail, Phone, Building, Calendar, MapPin, Briefcase, User, Clock } from "lucide-react"

export function PersonalInfoTab() {
  const { currentUser } = useUsers()

  if (!currentUser) return null

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Your personal contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <a href={`mailto:${currentUser.email}`} className="text-sm text-blue-600 hover:underline">
                {currentUser.email}
              </a>
            </div>

            {currentUser.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Phone:</span>
                <a href={`tel:${currentUser.phone}`} className="text-sm">
                  {currentUser.phone}
                </a>
              </div>
            )}

            {currentUser.department && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Department:</span>
                <span className="text-sm">{currentUser.department}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Member Since:</span>
              <span className="text-sm">{formatDate(currentUser.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Your professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Job Title:</span>
              <span className="text-sm">{currentUser.jobTitle || "Not specified"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Department:</span>
              <span className="text-sm">{currentUser.department || "Not assigned"}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm">{currentUser.location || "Not specified"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm font-mono">{currentUser.id}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Created On:</span>
              <span className="text-sm">{formatDate(currentUser.createdAt)}</span>
            </div>

            {currentUser.lastActive && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Active:</span>
                <span className="text-sm">{formatDate(currentUser.lastActive)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {currentUser.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About Me</CardTitle>
            <CardDescription>Professional biography</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{currentUser.bio}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

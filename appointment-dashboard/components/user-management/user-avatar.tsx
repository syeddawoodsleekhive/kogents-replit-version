import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { CreateUserResponse, User } from "./types"

interface UserAvatarProps {
  user: CreateUserResponse | User
  size?: "sm" | "md" | "lg"
  showStatus?: boolean
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = "md", showStatus = false }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-gray-400"
      case "pending":
        return "bg-yellow-500"
      case "suspended":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        {/* <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} /> */}
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
            user.status,
          )}`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

"use client"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserDetail } from "@/components/user-management/user-detail"
import { UserProvider } from "@/components/user-management/user-context"
import { ChevronLeft } from "lucide-react"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>

            <UserDetail userId={userId} />
          </div>
        </main>
      </div>
    </UserProvider>
  )
}

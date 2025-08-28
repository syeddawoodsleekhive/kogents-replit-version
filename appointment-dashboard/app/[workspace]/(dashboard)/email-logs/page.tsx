import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailLogViewer } from "@/components/email-log-viewer"

export default function EmailLogsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Email Logs</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Communication History</CardTitle>
            <CardDescription>
              View and manage all email communications sent to customers for appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailLogViewer />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

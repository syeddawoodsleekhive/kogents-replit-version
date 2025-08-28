import { ReminderDashboard } from "@/components/reminder-dashboard"

export default function NotificationsSettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <ReminderDashboard />
      </main>
    </div>
  )
}

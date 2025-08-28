import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentCalendar } from "@/components/appointment-calendar"

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Appointment Calendar</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Schedule</CardTitle>
            <CardDescription>View and manage all appointments in a calendar format.</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentCalendar />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

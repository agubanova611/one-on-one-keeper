import Link from "next/link"
import { notFound } from "next/navigation"
import { getMeeting } from "@/actions/meeting.actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, MapPin, User } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { ActionItemsList } from "@/components/action-items-list"
import { MeetingNotes } from "@/components/meeting-notes"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const meeting = await getMeeting(id)
  return { title: meeting ? `Встреча ${format(parseISO(meeting.date), "d MMM")} - 1:1 Keeper` : "Встреча" }
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const meeting = await getMeeting(id)

  if (!meeting) {
    notFound()
  }

  const employee = meeting.employee
  const initials = employee?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  const completedItems = meeting.action_items.filter(i => i.completed).length
  const totalItems = meeting.action_items.length
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/meetings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-medium text-primary">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{employee?.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(meeting.date), "EEEE, d MMMM yyyy", { locale: ru })}
                </span>
                {meeting.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {meeting.time.slice(0, 5)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Тип встречи</div>
            <div className="text-lg font-medium">{meeting.meeting_type}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Длительность</div>
            <div className="text-lg font-medium">{meeting.duration_minutes} минут</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Статус</div>
            <Badge variant={meeting.status === "completed" ? "default" : meeting.status === "scheduled" ? "secondary" : "outline"}>
              {meeting.status === "completed" ? "Проведена" : 
               meeting.status === "scheduled" ? "Запланирована" : "Отменена"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {meeting.location && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {meeting.location}
            </div>
          </CardContent>
        </Card>
      )}

      <MeetingNotes meetingId={id} initialNotes={meeting.notes} />

      <ActionItemsList 
        meetingId={id} 
        actionItems={meeting.action_items}
        progress={progress}
        completedCount={completedItems}
        totalCount={totalItems}
      />
    </div>
  )
}

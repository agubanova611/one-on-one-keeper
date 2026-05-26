import Link from "next/link"
import { getMeetings } from "@/actions/meeting.actions"
import { getEmployees } from "@/actions/employee.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Calendar, Filter } from "lucide-react"
import { format, parseISO, isToday, isPast, isFuture } from "date-fns"
import { ru } from "date-fns/locale"
import { MeetingStatus } from "@/types/database"

export const metadata = {
  title: "Встречи - 1:1 Keeper",
}

export default async function MeetingsPage() {
  const [meetings, employees] = await Promise.all([
    getMeetings(),
    getEmployees(),
  ])

  const upcomingMeetings = meetings.filter(m => m.status === "scheduled" && isFuture(parseISO(m.date)))
  const completedMeetings = meetings.filter(m => m.status === "completed")
  const todayMeetings = meetings.filter(m => isToday(parseISO(m.date)))

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="default">Запланирована</Badge>
      case "completed":
        return <Badge variant="secondary">Проведена</Badge>
      case "cancelled":
        return <Badge variant="outline">Отменена</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Встречи</h1>
          <p className="text-muted-foreground">
            Все встречи 1:1 с вашей командой
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая встреча
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Предстоящие ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="today">
            Сегодня ({todayMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Проведённые ({completedMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Все ({meetings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет предстоящих встреч</h3>
                <p className="text-muted-foreground mb-4">Запланируйте новую встречу</p>
                <Button asChild>
                  <Link href="/meetings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать встречу
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          {todayMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Нет встреч на сегодня</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {todayMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Нет проведённых встреч</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет встреч</h3>
                <p className="text-muted-foreground mb-4">Создайте первую встречу</p>
                <Button asChild>
                  <Link href="/meetings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Создать встречу
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MeetingCard({ meeting }: { meeting: any }) {
  const employee = meeting.employee
  const initials = employee?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{initials}</span>
              </div>
              <div>
                <div className="font-medium">{employee?.name || "Неизвестный"}</div>
                <div className="text-sm text-muted-foreground">
                  {format(parseISO(meeting.date), "EEEE, d MMMM yyyy", { locale: ru })}
                  {meeting.time && ` • ${meeting.time.slice(0, 5)}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">{meeting.meeting_type}</div>
                <div className="text-xs text-muted-foreground">{meeting.duration_minutes} мин</div>
              </div>
              {meeting.status === "scheduled" && (
                <Badge variant="default">Запланирована</Badge>
              )}
              {meeting.status === "completed" && (
                <Badge variant="secondary">Проведена</Badge>
              )}
              {meeting.status === "cancelled" && (
                <Badge variant="outline">Отменена</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

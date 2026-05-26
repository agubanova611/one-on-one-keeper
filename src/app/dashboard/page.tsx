import { Suspense } from "react"
import Link from "next/link"
import { getProfile } from "@/actions/profile.actions"
import { getUpcomingMeetings } from "@/actions/meeting.actions"
import { getOpenActionItemsCount, getOverdueActionItems } from "@/actions/action-item.actions"
import { getEmployees } from "@/actions/employee.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Users, CheckSquare, AlertTriangle, Plus, ArrowRight } from "lucide-react"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import { ru } from "date-fns/locale"

async function StatsCards() {
  const [employees, openCount, overdueItems, upcomingMeetings] = await Promise.all([
    getEmployees(),
    getOpenActionItemsCount(),
    getOverdueActionItems(),
    getUpcomingMeetings(),
  ])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Сотрудники</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{employees.length}</div>
          <p className="text-xs text-muted-foreground">
            в вашей команде
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Встречи на неделе</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
          <p className="text-xs text-muted-foreground">
            запланировано
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Открытые задачи</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openCount}</div>
          <p className="text-xs text-muted-foreground">
            ожидают выполнения
          </p>
        </CardContent>
      </Card>

      <Card className={overdueItems.length > 0 ? "border-destructive" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${overdueItems.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${overdueItems.length > 0 ? "text-destructive" : ""}`}>
            {overdueItems.length}
          </div>
          <p className="text-xs text-muted-foreground">
            требуют внимания
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function UpcomingMeetingsSection() {
  const meetings = await getUpcomingMeetings()

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Предстоящие встречи</CardTitle>
          <CardDescription>На ближайшую неделю</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Нет запланированных встреч на эту неделю.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/meetings/new">
              <Plus className="mr-2 h-4 w-4" />
              Запланировать встречу
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Предстоящие встречи</CardTitle>
          <CardDescription>На ближайшую неделю</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/meetings">
            Все встречи
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meetings.slice(0, 5).map((meeting) => {
            const date = parseISO(meeting.date)
            let dateLabel = format(date, "EEE, d MMM", { locale: ru })
            if (isToday(date)) dateLabel = "Сегодня"
            else if (isTomorrow(date)) dateLabel = "Завтра"

            return (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-medium">{dateLabel}</div>
                    {meeting.time && (
                      <div className="text-xs text-muted-foreground">
                        {meeting.time.slice(0, 5)}
                      </div>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(meeting.employee as any)?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{(meeting.employee as any)?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {meeting.duration_minutes} мин • {meeting.meeting_type}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{meeting.status}</Badge>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

async function OverdueSection() {
  const overdueItems = await getOverdueActionItems()

  if (overdueItems.length === 0) {
    return null
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Просроченные задачи
        </CardTitle>
        <CardDescription>Требуют немедленного внимания</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {overdueItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded bg-destructive/10"
            >
              <span className="text-sm font-medium">{item.title}</span>
              <Badge variant="destructive">
                {item.due_date && format(parseISO(item.due_date), "d MMM", { locale: ru })}
              </Badge>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href="/action-items?filter=overdue">
            Все просроченные
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Быстрые действия</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" className="h-20 flex-col gap-2">
          <Link href="/employees/new">
            <Users className="h-5 w-5" />
            <span>Добавить сотрудника</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col gap-2">
          <Link href="/meetings/new">
            <Calendar className="h-5 w-5" />
            <span>Новая встреча</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const profile = await getProfile()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Добро пожаловать{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Управляйте встречами 1:1 с вашей командой
        </p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <UpcomingMeetingsSection />
        </Suspense>
        
        <div className="space-y-6">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <OverdueSection />
          </Suspense>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

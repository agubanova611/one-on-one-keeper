import Link from "next/link"
import { notFound } from "next/navigation"
import { getEmployee, getEmployeeStats } from "@/actions/employee.actions"
import { getMeetings } from "@/actions/meeting.actions"
import { getActionItems } from "@/actions/action-item.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Mail, Briefcase, Building, Edit, Plus, CheckSquare, Users } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employee = await getEmployee(id)
  return { title: employee ? `${employee.name} - 1:1 Keeper` : "Сотрудник" }
}

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [employee, stats] = await Promise.all([
    getEmployee(id),
    getEmployeeStats(id),
  ])

  if (!employee) {
    notFound()
  }

  const meetings = await getMeetings({ employeeId: id })
  const actionItems = await getActionItems({ employeeId: id, completed: false })

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={employee.avatar_url || undefined} alt={employee.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
              {employee.role && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {employee.role}
                </span>
              )}
              {employee.department && (
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {employee.department}
                </span>
              )}
              {employee.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {employee.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/employees/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/meetings/new?employee=${id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Новая встреча
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего встреч</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проведено</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Открытые задачи</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openActionItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Последняя встреча</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastMeetingDate
                ? format(parseISO(stats.lastMeetingDate), "d MMM", { locale: ru })
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Meetings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Последние встречи</CardTitle>
            <CardDescription>История встреч 1:1</CardDescription>
          </div>
          {meetings.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/meetings?employee=${id}`}>Все встречи</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет встреч с этим сотрудником</p>
          ) : (
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-medium">
                        {format(parseISO(meeting.date), "d MMM yyyy", { locale: ru })}
                      </div>
                      {meeting.time && (
                        <div className="text-xs text-muted-foreground">
                          {meeting.time.slice(0, 5)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{meeting.meeting_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {meeting.duration_minutes} мин
                      </div>
                    </div>
                  </div>
                  <Badge variant={meeting.status === "completed" ? "default" : "outline"}>
                    {meeting.status === "completed" ? "Проведена" : 
                     meeting.status === "scheduled" ? "Запланирована" : "Отменена"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

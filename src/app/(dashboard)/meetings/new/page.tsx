"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createMeeting } from "@/actions/meeting.actions"
import { getEmployees } from "@/actions/employee.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Employee, MeetingStatus, MeetingType } from "@/types/database"

function NewMeetingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    employee_id: searchParams.get("employee") || "",
    date: "",
    time: "",
    duration_minutes: 30,
    status: "scheduled" as MeetingStatus,
    notes: "",
    meeting_type: "1:1" as MeetingType,
    location: "",
  })

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employee_id) {
      toast({ title: "Ошибка", description: "Выберите сотрудника", variant: "destructive" })
      return
    }
    setLoading(true)

    try {
      await createMeeting(formData)
      toast({ title: "Встреча создана", description: "Встреча успешно запланирована" })
      router.push("/meetings")
      router.refresh()
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось создать встречу", variant: "destructive" })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Детали встречи</CardTitle>
          <CardDescription>Заполните информацию о встрече</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Сотрудник *</Label>
            <Select value={formData.employee_id} onValueChange={(v) => setFormData({ ...formData, employee_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Дата *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Время</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тип встречи</Label>
              <Select value={formData.meeting_type} onValueChange={(v) => setFormData({ ...formData, meeting_type: v as MeetingType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="coaching">Коучинг</SelectItem>
                  <SelectItem value="feedback">Обратная связь</SelectItem>
                  <SelectItem value="career">Карьерное развитие</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Длительность</Label>
              <Select value={String(formData.duration_minutes)} onValueChange={(v) => setFormData({ ...formData, duration_minutes: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 минут</SelectItem>
                  <SelectItem value="30">30 минут</SelectItem>
                  <SelectItem value="45">45 минут</SelectItem>
                  <SelectItem value="60">60 минут</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Место</Label>
            <Input
              placeholder="Переговорная 1 / Zoom"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Заметки</Label>
            <textarea
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Основные темы для обсуждения..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" asChild>
            <Link href="/meetings">Отмена</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать встречу
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default function NewMeetingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meetings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Новая встреча</h1>
          <p className="text-muted-foreground">Запланируйте встречу 1:1</p>
        </div>
      </div>

      <Suspense fallback={<Card><CardContent className="p-8 text-center">Загрузка...</CardContent></Card>}>
        <NewMeetingForm />
      </Suspense>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { getPendingReminders, markReminderSent } from "@/actions/reminder.actions"
import { createClient } from "@/lib/supabase/client"
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleNotification,
  createMeetingNotification,
  createActionItemNotification,
  isNotificationSupported,
} from "@/lib/notifications"
import { useToast } from "@/hooks/use-toast"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface ScheduledReminder {
  id: string
  timeoutId: string
  type: "meeting" | "action_item"
  referenceId: string
}

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [hasPermission, setHasPermission] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  // Check permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setHasPermission(getNotificationPermission() === "granted")
    }
  }, [])

  // Request permission and load reminders
  useEffect(() => {
    const init = async () => {
      if (!isNotificationSupported()) return

      // Try to get permission
      const granted = await requestNotificationPermission()
      setHasPermission(granted)

      if (!granted) return

      // Get pending reminders from server
      try {
        const reminders = await getPendingReminders()
        setPendingCount(reminders.length)

        // Show notifications for pending reminders
        for (const reminder of reminders) {
          await processReminder(reminder)
        }
      } catch (error) {
        console.error("Failed to load reminders:", error)
      }

      // Subscribe to new reminders via Realtime
      const channel = supabase
        .channel("reminders")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "reminders",
          },
          async (payload) => {
            await processReminder(payload.new as any)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    init()
  }, [])

  const processReminder = async (reminder: any) => {
    try {
      if (reminder.type === "meeting") {
        // Get meeting details
        const { data: meeting } = await supabase
          .from("meetings")
          .select("*, employee:employees(name)")
          .eq("id", reminder.reference_id)
          .single()

        if (meeting && reminder.remind_at) {
          const notification = createMeetingNotification({
            id: meeting.id,
            employeeName: meeting.employee?.name || "Сотрудник",
            date: meeting.date,
            time: meeting.time,
          })

          const timeoutId = scheduleNotification(notification, new Date(reminder.remind_at))
          
          if (timeoutId) {
            setScheduledReminders((prev) => [
              ...prev,
              {
                id: reminder.id,
                timeoutId,
                type: "meeting",
                referenceId: meeting.id,
              },
            ])
          }

          await markReminderSent(reminder.id)
          setPendingCount((prev) => Math.max(0, prev - 1))
        }
      } else if (reminder.type === "action_item") {
        // Get action item details
        const { data: item } = await supabase
          .from("action_items")
          .select("*")
          .eq("id", reminder.reference_id)
          .single()

        if (item && reminder.remind_at) {
          const notification = createActionItemNotification({
            id: item.id,
            title: item.title,
            dueDate: item.due_date || new Date().toISOString(),
          })

          const timeoutId = scheduleNotification(notification, new Date(reminder.remind_at))
          
          if (timeoutId) {
            setScheduledReminders((prev) => [
              ...prev,
              {
                id: reminder.id,
                timeoutId,
                type: "action_item",
                referenceId: item.id,
              },
            ])
          }

          await markReminderSent(reminder.id)
          setPendingCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error("Failed to process reminder:", error)
    }
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setHasPermission(granted)
    
    if (granted) {
      toast({
        title: "Уведомления включены",
        description: "Вы будете получать напоминания о встречах и задачах",
      })
    } else {
      toast({
        title: "Уведомления заблокированы",
        description: "Разрешите уведомления в настройках браузера",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {children}
      
      {/* Notification Bell */}
      <div className="fixed bottom-4 right-4 z-50">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg"
              variant={hasPermission ? "default" : "outline"}
            >
              {hasPermission ? (
                <Bell className="h-5 w-5" />
              ) : (
                <BellOff className="h-5 w-5" />
              )}
              {pendingCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  variant="destructive"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Напоминания</h4>
                {!hasPermission && (
                  <Button size="sm" variant="outline" onClick={handleRequestPermission}>
                    Включить
                  </Button>
                )}
              </div>
              
              {!hasPermission ? (
                <p className="text-sm text-muted-foreground">
                  Включите уведомления, чтобы получать напоминания о встречах и задачах
                </p>
              ) : pendingCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Нет активных напоминаний
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {pendingCount} напоминание(ий) в очереди
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}

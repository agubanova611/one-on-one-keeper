// Notification Service for Browser Notifications

export type NotificationType = "meeting" | "action_item"

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  body: string
  icon?: string
  tag?: string
}

let notificationPermission: NotificationPermission = "default"

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  return "Notification" in window
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false
  }

  if (notificationPermission === "granted") {
    return true
  }

  const permission = await Notification.requestPermission()
  notificationPermission = permission
  return permission === "granted"
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return "denied"
  }
  return Notification.permission
}

// Schedule a notification at a specific time
export function scheduleNotification(data: NotificationData, at: Date): string {
  const now = Date.now()
  const delay = at.getTime() - now
  
  if (delay <= 0) {
    // If delay is negative, show immediately
    showNotification(data)
    return ""
  }

  const timeoutId = setTimeout(() => {
    showNotification(data)
  }, delay)

  return String(timeoutId)
}

// Show a notification immediately
export function showNotification(data: NotificationData): void {
  if (!isNotificationSupported() || notificationPermission !== "granted") {
    return
  }

  const notification = new Notification(data.title, {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    tag: data.tag || data.id,
    badge: "/favicon.ico",
    requireInteraction: data.type === "meeting",
    silent: data.type === "action_item",
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
    
    // Navigate based on notification type
    if (data.type === "meeting") {
      window.location.href = `/meetings/${data.id}`
    } else {
      window.location.href = `/action-items`
    }
  }

  // Auto-close after 10 seconds for action items
  if (data.type === "action_item") {
    setTimeout(() => notification.close(), 10000)
  }
}

// Cancel a scheduled notification
export function cancelNotification(timeoutId: string): void {
  clearTimeout(Number(timeoutId))
}

// Create meeting reminder notification data
export function createMeetingNotification(meeting: {
  id: string
  employeeName: string
  date: string
  time?: string | null
}): NotificationData {
  const dateStr = new Date(meeting.date).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  
  return {
    id: meeting.id,
    type: "meeting",
    title: "Скоро встреча 1:1",
    body: `Встреча с ${meeting.employeeName} ${dateStr}${meeting.time ? ` в ${meeting.time.slice(0, 5)}` : ""}`,
    tag: `meeting-${meeting.id}`,
  }
}

// Create action item reminder notification data
export function createActionItemNotification(item: {
  id: string
  title: string
  dueDate: string
}): NotificationData {
  const dateStr = new Date(item.dueDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })
  
  return {
    id: item.id,
    type: "action_item",
    title: "Дедлайн задачи",
    body: `${item.title} — до ${dateStr}`,
    tag: `action-item-${item.id}`,
  }
}

"use client"

import { ReminderProvider } from "@/components/reminder-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <ReminderProvider>{children}</ReminderProvider>
}

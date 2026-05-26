"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Reminder } from "@/types/database"

export async function getPendingReminders(): Promise<Reminder[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("sent", false)
    .lte("remind_at", new Date().toISOString())
    .order("remind_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getReminders(includeSent = false): Promise<Reminder[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  let query = supabase
    .from("reminders")
    .select("*")
    .eq("user_id", userData.user.id)

  if (!includeSent) {
    query = query.eq("sent", false)
  }

  const { data, error } = await query.order("remind_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function markReminderSent(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("reminders")
    .update({
      sent: true,
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
}

export async function deleteReminder(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/")
}

export async function getReminderWithDetails(id: string) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (reminderError || !reminder) {
    return null
  }

  if (reminder.type === "meeting") {
    const { data: meeting } = await supabase
      .from("meetings")
      .select(`
        *,
        employee:employees(name, avatar_url)
      `)
      .eq("id", reminder.reference_id)
      .single()

    return { reminder, meeting, actionItem: null }
  } else {
    const { data: actionItem } = await supabase
      .from("action_items")
      .select(`
        *,
        employee:employees(name, avatar_url)
      `)
      .eq("id", reminder.reference_id)
      .single()

    return { reminder, meeting: null, actionItem }
  }
}

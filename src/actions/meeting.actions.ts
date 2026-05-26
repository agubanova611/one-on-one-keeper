"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Meeting, MeetingFormData, MeetingWithDetails } from "@/types/database"
import { addDays, addMinutes, subDays, subMinutes, startOfDay, endOfDay } from "date-fns"

// Get all meetings for the current user
export async function getMeetings(filters?: {
  employeeId?: string
  status?: string
  fromDate?: string
  toDate?: string
}): Promise<Meeting[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  let query = supabase
    .from("meetings")
    .select(`
      *,
      employee:employees(*)
    `)
    .eq("employee.created_by", userData.user.id)

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.fromDate) {
    query = query.gte("date", filters.fromDate)
  }

  if (filters?.toDate) {
    query = query.lte("date", filters.toDate)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Get a single meeting with all details
export async function getMeeting(id: string): Promise<MeetingWithDetails | null> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  // Get meeting with employee
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select(`
      *,
      employee:employees(*)
    `)
    .eq("id", id)
    .eq("employee.created_by", userData.user.id)
    .single()

  if (meetingError) {
    return null
  }

  // Get action items
  const { data: actionItems } = await supabase
    .from("action_items")
    .select("*")
    .eq("meeting_id", id)
    .order("created_at", { ascending: true })

  // Get topics
  const { data: topics } = await supabase
    .from("meeting_topics")
    .select("*")
    .eq("meeting_id", id)
    .order("order_index", { ascending: true })

  return {
    ...meeting,
    action_items: actionItems || [],
    topics: topics || [],
  }
}

// Create a new meeting
export async function createMeeting(formData: MeetingFormData): Promise<Meeting> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      employee_id: formData.employee_id,
      date: formData.date,
      time: formData.time || null,
      duration_minutes: formData.duration_minutes,
      status: formData.status,
      notes: formData.notes || null,
      meeting_type: formData.meeting_type,
      location: formData.location || null,
      created_by: userData.user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Create meeting reminder
  await createMeetingReminder(data.id, formData.date, formData.time ?? null, formData.duration_minutes)

  revalidatePath("/meetings")
  revalidatePath(`/employees/${formData.employee_id}`)
  revalidatePath("/")
  
  return data
}

// Update a meeting
export async function updateMeeting(id: string, formData: Partial<MeetingFormData>): Promise<Meeting> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  // Get current meeting to check ownership
  const { data: currentMeeting } = await supabase
    .from("meetings")
    .select("employee_id, date, time, duration_minutes")
    .eq("id", id)
    .single()

  if (!currentMeeting) {
    throw new Error("Meeting not found")
  }

  const { data, error } = await supabase
    .from("meetings")
    .update({
      employee_id: formData.employee_id,
      date: formData.date,
      time: formData.time || null,
      duration_minutes: formData.duration_minutes,
      status: formData.status,
      notes: formData.notes || null,
      meeting_type: formData.meeting_type,
      location: formData.location || null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Update reminder
  if (formData.date || formData.time || formData.duration_minutes) {
    await deleteMeetingReminders(id)
    await createMeetingReminder(
      id,
      formData.date || currentMeeting.date,
      (formData.time ?? null) || currentMeeting.time,
      formData.duration_minutes || currentMeeting.duration_minutes
    )
  }

  revalidatePath("/meetings")
  revalidatePath(`/meetings/${id}`)
  revalidatePath(`/employees/${formData.employee_id || currentMeeting.employee_id}`)
  revalidatePath("/")
  
  return data
}

// Delete a meeting
export async function deleteMeeting(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  // Get meeting to get employee_id before deleting
  const { data: meeting } = await supabase
    .from("meetings")
    .select("employee_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  // Delete reminders
  await deleteMeetingReminders(id)

  revalidatePath("/meetings")
  if (meeting) {
    revalidatePath(`/employees/${meeting.employee_id}`)
  }
  revalidatePath("/")
}

// Get upcoming meetings (next 7 days)
export async function getUpcomingMeetings(): Promise<(Meeting & { employee?: { name?: string } | null })[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const today = startOfDay(new Date())
  const nextWeek = endOfDay(addDays(today, 7))

  const { data, error } = await supabase
    .from("meetings")
    .select(`
      *,
      employee:employees(*)
    `)
    .eq("employee.created_by", userData.user.id)
    .eq("status", "scheduled")
    .gte("date", today.toISOString().split("T")[0])
    .lte("date", nextWeek.toISOString().split("T")[0])
    .order("date", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Get recent meetings (past 30 days)
export async function getRecentMeetings(limit = 10): Promise<Meeting[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const thirtyDaysAgo = subDays(new Date(), 30)

  const { data, error } = await supabase
    .from("meetings")
    .select(`
      *,
      employee:employees(*)
    `)
    .eq("employee.created_by", userData.user.id)
    .eq("status", "completed")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Helper function to create meeting reminder
async function createMeetingReminder(
  meetingId: string,
  date: string,
  time: string | null,
  durationMinutes: number
) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return

  // Get user's reminder preference
  const { data: profile } = await supabase
    .from("profiles")
    .select("meeting_reminder_minutes")
    .eq("id", userData.user.id)
    .single()

  const reminderMinutes = profile?.meeting_reminder_minutes || 15
  
  // Calculate reminder time
  const meetingDateTime = time 
    ? new Date(`${date}T${time}`)
    : new Date(`${date}T09:00`)
  
  const reminderTime = subMinutes(meetingDateTime, reminderMinutes)

  // Only create reminder if it's in the future
  if (reminderTime > new Date()) {
    await supabase.from("reminders").insert({
      user_id: userData.user.id,
      type: "meeting",
      reference_id: meetingId,
      remind_at: reminderTime.toISOString(),
    })
  }
}

// Helper function to delete meeting reminders
async function deleteMeetingReminders(meetingId: string) {
  const supabase = await createClient()
  
  await supabase
    .from("reminders")
    .delete()
    .eq("type", "meeting")
    .eq("reference_id", meetingId)
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ActionItem, ActionItemFormData } from "@/types/database"
import { subDays } from "date-fns"

// Get all action items for the current user
export async function getActionItems(filters?: {
  meetingId?: string
  employeeId?: string
  completed?: boolean
  overdue?: boolean
}): Promise<ActionItem[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  let query = supabase
    .from("action_items")
    .select(`
      *,
      employee:employees(id, name, avatar_url)
    `)
    .or(`created_by.eq.${userData.user.id},assigned_to.eq.${userData.user.id}`)

  if (filters?.meetingId) {
    query = query.eq("meeting_id", filters.meetingId)
  }

  if (filters?.employeeId) {
    query = query.eq("employee_id", filters.employeeId)
  }

  if (filters?.completed !== undefined) {
    query = query.eq("completed", filters.completed)
  }

  if (filters?.overdue) {
    const today = new Date().toISOString().split("T")[0]
    query = query
      .eq("completed", false)
      .not("due_date", "is", null)
      .lt("due_date", today)
  }

  const { data, error } = await query.order("due_date", { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Get action items for a specific meeting
export async function getMeetingActionItems(meetingId: string): Promise<ActionItem[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("action_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Create a new action item
export async function createActionItem(formData: ActionItemFormData): Promise<ActionItem> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("action_items")
    .insert({
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || userData.user.id,
      meeting_id: formData.meeting_id || null,
      employee_id: formData.employee_id || null,
      created_by: userData.user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Create reminder if due date is set
  if (formData.due_date) {
    await createActionItemReminder(data.id, formData.due_date)
  }

  revalidatePath("/action-items")
  if (formData.meeting_id) {
    revalidatePath(`/meetings/${formData.meeting_id}`)
  }
  if (formData.employee_id) {
    revalidatePath(`/employees/${formData.employee_id}`)
  }
  revalidatePath("/")
  
  return data
}

// Update an action item
export async function updateActionItem(
  id: string,
  formData: Partial<ActionItemFormData>
): Promise<ActionItem> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("action_items")
    .update({
      title: formData.title,
      description: formData.description || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
      assigned_to: formData.assigned_to || null,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Update reminder if due date changed
  await deleteActionItemReminder(id)
  if (formData.due_date) {
    await createActionItemReminder(id, formData.due_date)
  }

  revalidatePath("/action-items")
  if (data.meeting_id) {
    revalidatePath(`/meetings/${data.meeting_id}`)
  }
  revalidatePath("/")
  
  return data
}

// Toggle action item completion
export async function toggleActionItem(id: string, completed: boolean): Promise<ActionItem> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("action_items")
    .update({ completed })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Delete reminder if completed
  if (completed) {
    await deleteActionItemReminder(id)
  }

  revalidatePath("/action-items")
  if (data.meeting_id) {
    revalidatePath(`/meetings/${data.meeting_id}`)
  }
  if (data.employee_id) {
    revalidatePath(`/employees/${data.employee_id}`)
  }
  revalidatePath("/")
  
  return data
}

// Delete an action item
export async function deleteActionItem(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  // Get meeting_id before deleting
  const { data: actionItem } = await supabase
    .from("action_items")
    .select("meeting_id, employee_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("action_items")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  // Delete reminder
  await deleteActionItemReminder(id)

  revalidatePath("/action-items")
  if (actionItem?.meeting_id) {
    revalidatePath(`/meetings/${actionItem.meeting_id}`)
  }
  if (actionItem?.employee_id) {
    revalidatePath(`/employees/${actionItem.employee_id}`)
  }
  revalidatePath("/")
}

// Get overdue action items
export async function getOverdueActionItems(): Promise<ActionItem[]> {
  return getActionItems({ completed: false, overdue: true })
}

// Get open action items count
export async function getOpenActionItemsCount(): Promise<number> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { count, error } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("completed", false)
    .or(`created_by.eq.${userData.user.id},assigned_to.eq.${userData.user.id}`)

  if (error) {
    throw new Error(error.message)
  }

  return count || 0
}

// Helper function to create action item reminder
async function createActionItemReminder(actionItemId: string, dueDate: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return

  // Get user's reminder preference
  const { data: profile } = await supabase
    .from("profiles")
    .select("action_item_reminder_days")
    .eq("id", userData.user.id)
    .single()

  const reminderDays = profile?.action_item_reminder_days || 1
  
  // Calculate reminder time
  const dueDateTime = new Date(dueDate)
  const reminderTime = subDays(dueDateTime, reminderDays)

  // Only create reminder if it's in the future
  if (reminderTime > new Date()) {
    await supabase.from("reminders").insert({
      user_id: userData.user.id,
      type: "action_item",
      reference_id: actionItemId,
      remind_at: reminderTime.toISOString(),
    })
  }
}

// Helper function to delete action item reminder
async function deleteActionItemReminder(actionItemId: string) {
  const supabase = await createClient()
  
  await supabase
    .from("reminders")
    .delete()
    .eq("type", "action_item")
    .eq("reference_id", actionItemId)
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Employee, EmployeeFormData } from "@/types/database"

// Get all employees for the current user
export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Get a single employee by ID
export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single()

  if (error) {
    return null
  }

  return data
}

// Create a new employee
export async function createEmployee(formData: EmployeeFormData): Promise<Employee> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("employees")
    .insert({
      user_id: userData.user.id,
      created_by: userData.user.id,
      name: formData.name,
      role: formData.role || null,
      email: formData.email || null,
      avatar_url: formData.avatar_url || null,
      department: formData.department || null,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/employees")
  return data
}

// Update an employee
export async function updateEmployee(id: string, formData: Partial<EmployeeFormData>): Promise<Employee> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("employees")
    .update({
      name: formData.name,
      role: formData.role || null,
      email: formData.email || null,
      avatar_url: formData.avatar_url || null,
      department: formData.department || null,
      notes: formData.notes || null,
    })
    .eq("id", id)
    .eq("created_by", userData.user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/employees")
  revalidatePath(`/employees/${id}`)
  return data
}

// Delete (soft) an employee
export async function deleteEmployee(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("employees")
    .update({ is_active: false })
    .eq("id", id)
    .eq("created_by", userData.user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/employees")
}

// Get employee statistics
export async function getEmployeeStats(employeeId: string) {
  const supabase = await createClient()
  
  // Get meeting count
  const { count: meetingCount } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)

  // Get completed meetings
  const { count: completedCount } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("status", "completed")

  // Get open action items
  const { count: openActionsCount } = await supabase
    .from("action_items")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("completed", false)

  // Get last meeting date
  const { data: lastMeeting } = await supabase
    .from("meetings")
    .select("date")
    .eq("employee_id", employeeId)
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(1)
    .single()

  return {
    totalMeetings: meetingCount || 0,
    completedMeetings: completedCount || 0,
    openActionItems: openActionsCount || 0,
    lastMeetingDate: lastMeeting?.date || null,
  }
}

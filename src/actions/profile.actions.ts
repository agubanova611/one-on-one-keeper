"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Profile, ProfileFormData } from "@/types/database"

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return null
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateProfile(formData: ProfileFormData): Promise<Profile> {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.full_name || null,
      avatar_url: formData.avatar_url || null,
      email_notifications_enabled: formData.email_notifications_enabled,
      meeting_reminder_minutes: formData.meeting_reminder_minutes,
      action_item_reminder_days: formData.action_item_reminder_days,
    })
    .eq("id", userData.user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/settings")
  revalidatePath("/")
  
  return data
}

export async function updateAvatar(url: string): Promise<Profile> {
  return updateProfile({ avatar_url: url })
}

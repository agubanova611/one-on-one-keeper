"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { MeetingTopic, MeetingTopicInsert } from "@/types/database"

export async function getMeetingTopics(meetingId: string): Promise<MeetingTopic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("meeting_topics")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("order_index", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function createTopic(meetingId: string, topic: string, orderIndex?: number): Promise<MeetingTopic> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("meeting_topics")
    .insert({
      meeting_id: meetingId,
      topic,
      order_index: orderIndex ?? 0,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/meetings/${meetingId}`)
  return data
}

export async function updateTopic(
  id: string,
  data: { topic?: string; order_index?: number; is_covered?: boolean; notes?: string }
): Promise<MeetingTopic> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from("meeting_topics")
    .update(data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/meetings/${updated.meeting_id}`)
  return updated
}

export async function toggleTopicCovered(id: string, isCovered: boolean): Promise<MeetingTopic> {
  return updateTopic(id, { is_covered: isCovered })
}

export async function deleteTopic(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: topic } = await supabase
    .from("meeting_topics")
    .select("meeting_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("meeting_topics")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  if (topic) {
    revalidatePath(`/meetings/${topic.meeting_id}`)
  }
}

export async function reorderTopics(topicIds: string[]): Promise<void> {
  const supabase = await createClient()

  for (let i = 0; i < topicIds.length; i++) {
    await supabase
      .from("meeting_topics")
      .update({ order_index: i })
      .eq("id", topicIds[i])
  }
}

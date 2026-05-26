// Supabase Edge Function for sending reminders
// This runs on a schedule (via cron) to process and send reminders

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

interface Reminder {
  id: string
  user_id: string
  type: "meeting" | "action_item"
  reference_id: string
  remind_at: string
  sent: boolean
}

interface Meeting {
  id: string
  date: string
  time: string | null
  employee: {
    name: string
  } | null
}

interface ActionItem {
  id: string
  title: string
  due_date: string | null
}

Deno.serve(async (req) => {
  // Only allow POST requests (or GET for testing)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date().toISOString()

    // Get pending reminders that are due
    const { data: reminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .eq("sent", false)
      .lte("remind_at", now)
      .limit(100)

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError)
      throw fetchError
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to process" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    console.log(`Processing ${reminders.length} reminders`)

    // Process each reminder
    for (const reminder of reminders as Reminder[]) {
      await processReminder(supabase, reminder)
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${reminders.length} reminders`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error processing reminders:", error)
    return new Response(
      JSON.stringify({ error: "Failed to process reminders" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

async function processReminder(supabase: any, reminder: Reminder) {
  try {
    if (reminder.type === "meeting") {
      // Get meeting details
      const { data: meeting } = await supabase
        .from("meetings")
        .select("*, employee:employees(name)")
        .eq("id", reminder.reference_id)
        .single()

      if (meeting) {
        await sendMeetingReminderEmail(supabase, reminder.user_id, meeting)
      }
    } else if (reminder.type === "action_item") {
      // Get action item details
      const { data: item } = await supabase
        .from("action_items")
        .select("*")
        .eq("id", reminder.reference_id)
        .single()

      if (item) {
        await sendActionItemReminderEmail(supabase, reminder.user_id, item)
      }
    }

    // Mark reminder as sent
    await supabase
      .from("reminders")
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", reminder.id)
  } catch (error) {
    console.error(`Error processing reminder ${reminder.id}:`, error)
  }
}

async function sendMeetingReminderEmail(supabase: any, userId: string, meeting: Meeting) {
  // Get user's email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single()

  if (!profile?.email) return

  const dateStr = new Date(meeting.date).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // Log the reminder (in production, integrate with an email service like SendGrid, Resend, etc.)
  console.log(`[EMAIL] Meeting reminder to ${profile.email}:
    Встреча с ${meeting.employee?.name || "сотрудником"}
    Дата: ${dateStr}
    ${meeting.time ? `Время: ${meeting.time}` : ""}
  `)

  // TODO: Integrate with email service
  // Example with Resend:
  // await sendEmail({
  //   to: profile.email,
  //   subject: "Напоминание: встреча 1:1",
  //   html: `...`
  // })
}

async function sendActionItemReminderEmail(supabase: any, userId: string, item: ActionItem) {
  // Get user's email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single()

  if (!profile?.email) return

  const dueDateStr = item.due_date
    ? new Date(item.due_date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      })
    : "не указан"

  // Log the reminder
  console.log(`[EMAIL] Action item reminder to ${profile.email}:
    Задача: ${item.title}
    Дедлайн: ${dueDateStr}
  `)

  // TODO: Integrate with email service
}

// Function to create reminders when meetings or action items are created
// This can be called from your app or via database triggers

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { type, reference_id, remind_at, user_id } = await req.json()

    if (!type || !reference_id || !remind_at || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create the reminder
    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id,
        type,
        reference_id,
        remind_at,
        sent: false,
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ reminder: data }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error creating reminder:", error)
    return new Response(
      JSON.stringify({ error: "Failed to create reminder" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

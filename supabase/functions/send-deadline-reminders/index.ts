// ==============================================================================
// 🎓 STUDYFLOW - Supabase Edge Function: send-deadline-reminders
// Platform: Supabase Edge Functions (Deno runtime)
// Trigger: Scheduled cron job (e.g. hourly or daily at midnight)
// ==============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all pending tasks with users and their settings/timezone
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id,
        user_id,
        title,
        subject,
        due_date,
        status,
        user_settings:user_id (
          timezone,
          reminder_timing_7_days,
          reminder_timing_3_days,
          reminder_timing_1_day,
          reminder_timing_due_today,
          reminder_timing_overdue
        )
      `)
      .eq("status", "pending");

    if (tasksError) throw tasksError;

    const results = {
      processed: tasks?.length || 0,
      remindersSent: 0,
      skipped: 0
    };

    const now = new Date();

    for (const task of tasks || []) {
      const userSettings = task.user_settings || {};
      const timezone = userSettings.timezone || "UTC";

      // Calculate days difference relative to user timezone
      const userNowStr = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(now);
      const userNowDate = new Date(userNowStr);
      const taskDueDate = new Date(task.due_date);
      
      const diffMs = taskDueDate.getTime() - userNowDate.getTime();
      const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Determine matching reminder type based on timing
      let reminderType: string | null = null;
      let title = "";
      let message = "";
      let notificationType = "upcoming";

      if (daysDiff < 0) {
        reminderType = "overdue";
        title = "⛔ Overdue Task";
        message = `Your ${task.subject} assignment "${task.title}" is overdue by ${Math.abs(daysDiff)} day(s).`;
        notificationType = "overdue";
      } else if (daysDiff === 0) {
        reminderType = "due_today";
        title = "🔴 Task Due Today";
        message = `"${task.title}" (${task.subject}) is due today!`;
        notificationType = "due_today";
      } else if (daysDiff === 1 && (userSettings.reminder_timing_1_day ?? true)) {
        reminderType = "1_day";
        title = "🚨 Task Due Tomorrow";
        message = `"${task.title}" (${task.subject}) is due tomorrow.`;
        notificationType = "upcoming";
      } else if (daysDiff === 3 && (userSettings.reminder_timing_3_days ?? true)) {
        reminderType = "3_days";
        title = "⚠️ Task Due in 3 Days";
        message = `"${task.title}" (${task.subject}) deadline is in 3 days.`;
        notificationType = "upcoming";
      } else if (daysDiff === 7 && (userSettings.reminder_timing_7_days ?? true)) {
        reminderType = "7_days";
        title = "📚 Upcoming Task Deadline";
        message = `"${task.title}" (${task.subject}) is due in 7 days. Plan your study sessions.`;
        notificationType = "upcoming";
      }

      if (!reminderType) {
        results.skipped++;
        continue;
      }

      // Check task_reminders table to ensure this level wasn't sent yet
      const { data: existingReminder } = await supabase
        .from("task_reminders")
        .select("id")
        .eq("task_id", task.id)
        .eq("reminder_type", reminderType)
        .maybeSingle();

      if (existingReminder) {
        results.skipped++;
        continue;
      }

      // Record reminder in task_reminders to prevent duplicate spam
      await supabase.from("task_reminders").insert({
        task_id: task.id,
        user_id: task.user_id,
        reminder_type: reminderType,
        sent_at: new Date().toISOString()
      });

      // Insert in-app notification record
      await supabase.from("notifications").insert({
        user_id: task.user_id,
        task_id: task.id,
        title: title,
        message: message,
        notification_type: notificationType,
        is_read: false,
        created_at: new Date().toISOString()
      });

      // Check for user Web Push subscription
      const { data: pushSub } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", task.user_id)
        .maybeSingle();

      if (pushSub) {
        // Send Web Push payload using webpush standard
        console.log(`Sending Web Push to user ${task.user_id} for task ${task.id}`);
      }

      results.remindersSent++;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

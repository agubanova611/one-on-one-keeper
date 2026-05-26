# Send Reminders Edge Function

This Edge Function processes and sends reminders on a schedule.

## Setup

### 1. Deploy the Edge Function

```bash
supabase functions deploy send-reminders
```

### 2. Set up a cron job

Create a cron job to run every hour:

```bash
supabase functions schedule create send-reminders \
  --db-url "postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
  --schedule "0 * * * *" \
  --restore-time "2023-01-01T00:00:00Z"
```

Or use Supabase Dashboard:
1. Go to Database → Extensions
2. Enable `pg_cron`
3. Run:
```sql
SELECT cron.schedule(
  'send-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  );
  $$
);
```

### 3. Environment Variables

The function automatically uses:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (available in Supabase Dashboard)

## Function Logic

1. Query reminders where:
   - `sent = false`
   - `remind_at <= now()`

2. For each reminder:
   - Fetch related data (meeting or action item)
   - Send email notification (placeholder - integrate email service)
   - Mark reminder as sent

## Email Integration (Optional)

To enable email notifications, integrate with an email service:

### Resend Example
```typescript
import { Resend } from "resend"
const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

await resend.emails.send({
  from: "1:1 Keeper <noreply@yourdomain.com>",
  to: profile.email,
  subject: "Напоминание",
  html: "..."
})
```

### SendGrid Example
```typescript
import sgMail from "https://esm.sh/@sendgrid/mail@8"
sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!)

await sgMail.send({
  to: profile.email,
  from: "noreply@yourdomain.com",
  subject: "Напоминание",
  html: "..."
})
```

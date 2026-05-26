# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and fill in the details
3. Wait for the database to be provisioned

## 2. Get Your API Keys

1. Go to Project Settings → API
2. Copy the following values:
   - `Project URL` → use as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Run the Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `schema.sql`
3. Click "Run" to execute

## 4. Configure Authentication

1. Go to Authentication → URL Configuration
2. Set Site URL to your app URL (e.g., `http://localhost:3000`)
3. Add to Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-project.vercel.app/auth/callback`
4. Enable providers (optional):
   - Email/Password (enabled by default)
   - Google OAuth (add credentials in Providers)

## 5. Update Environment Variables

Add to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | Extended user profile data |
| `employees` | Team members for 1:1 meetings |
| `meetings` | 1:1 meeting records |
| `action_items` | Tasks/follow-ups from meetings |
| `reminders` | Scheduled notification triggers |
| `meeting_topics` | Predefined topics for meetings |

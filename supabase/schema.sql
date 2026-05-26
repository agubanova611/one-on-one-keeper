-- =====================================================
-- 1:1 KEEPER - DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extended user profile data (linked to auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,
  meeting_reminder_minutes INTEGER DEFAULT 15,
  action_item_reminder_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EMPLOYEES TABLE
-- Team members for 1:1 meetings
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  avatar_url TEXT,
  department TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEETINGS TABLE
-- 1:1 meeting records
-- =====================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  meeting_type TEXT DEFAULT '1:1' CHECK (meeting_type IN ('1:1', 'coaching', 'feedback', 'career', 'other')),
  location TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTION ITEMS TABLE
-- Tasks/follow-ups from meetings
-- =====================================================
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REMINDERS TABLE
-- Scheduled notification triggers
-- =====================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('meeting', 'action_item')) NOT NULL,
  reference_id UUID NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MEETING TOPICS TABLE
-- Predefined topics for each meeting
-- =====================================================
CREATE TABLE IF NOT EXISTS meeting_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_covered BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_employee_id ON meetings(employee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting_id ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_employee_id ON action_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_completed ON action_items(completed);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent);
CREATE INDEX IF NOT EXISTS idx_meeting_topics_meeting_id ON meeting_topics(meeting_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_topics ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- EMPLOYEES Policies
CREATE POLICY "Users can view own employees"
  ON employees FOR SELECT
  USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can insert own employees"
  ON employees FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own employees"
  ON employees FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own employees"
  ON employees FOR DELETE
  USING (created_by = auth.uid());

-- MEETINGS Policies
CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update own meetings"
  ON meetings FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meetings"
  ON meetings FOR DELETE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    )
  );

-- ACTION ITEMS Policies
CREATE POLICY "Users can view own action items"
  ON action_items FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can insert own action items"
  ON action_items FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can update own action items"
  ON action_items FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    ) OR
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete own action items"
  ON action_items FOR DELETE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE created_by = auth.uid()
    ) OR
    created_by = auth.uid()
  );

-- REMINDERS Policies
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  USING (user_id = auth.uid());

-- MEETING TOPICS Policies
CREATE POLICY "Users can view own meeting topics"
  ON meeting_topics FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN employees e ON m.employee_id = e.id
      WHERE e.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage own meeting topics"
  ON meeting_topics FOR ALL
  USING (
    meeting_id IN (
      SELECT m.id FROM meetings m
      JOIN employees e ON m.employee_id = e.id
      WHERE e.created_by = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_items_updated_at ON action_items;
CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_topics_updated_at ON meeting_topics;
CREATE TRIGGER update_meeting_topics_updated_at
  BEFORE UPDATE ON meeting_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE REALTIME (for live updates)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE action_items;
ALTER PUBLICATION supabase_realtime ADD TABLE reminders;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- COMPLETED
-- =====================================================

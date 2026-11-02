-- ==============================================================================
-- 🎓 STUDYFLOW - Database Schema & Row Level Security (RLS)
-- Target Platform: Supabase (PostgreSQL)
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Navigate to "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste the entire contents of this file, and click "Run"
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES CREATION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES TABLE
-- Stores user profile data referencing auth.users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT DEFAULT 'Student',
    avatar_url TEXT DEFAULT '',
    study_goal TEXT DEFAULT '4 hours / day',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- TASKS TABLE
-- Stores individual tasks for each student. Subject is free-text!
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- STUDY SESSIONS TABLE
-- Logs completed study and break sessions for productivity analytics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    session_type TEXT NOT NULL CHECK (session_type IN ('study', 'break')) DEFAULT 'study',
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- USER SETTINGS TABLE
-- Stores user preferences, custom timer durations, and reminder settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT 'dark',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    study_duration INTEGER NOT NULL DEFAULT 45 CHECK (study_duration > 0),
    short_break_duration INTEGER NOT NULL DEFAULT 10 CHECK (short_break_duration > 0),
    long_break_duration INTEGER NOT NULL DEFAULT 20 CHECK (long_break_duration > 0),
    auto_start_break BOOLEAN NOT NULL DEFAULT false,
    auto_start_study BOOLEAN NOT NULL DEFAULT false,
    -- Reminder timing preferences (due_today and overdue are permanently mandatory)
    reminder_timing_7_days BOOLEAN NOT NULL DEFAULT true,
    reminder_timing_3_days BOOLEAN NOT NULL DEFAULT true,
    reminder_timing_1_day BOOLEAN NOT NULL DEFAULT true,
    reminder_timing_due_today BOOLEAN NOT NULL DEFAULT true,
    reminder_timing_overdue BOOLEAN NOT NULL DEFAULT true,
    notification_sound BOOLEAN NOT NULL DEFAULT true,
    browser_notifications_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- TASK REMINDERS TABLE
-- Tracks sent reminders per task & type to guarantee zero duplicate notification spam
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('7_days', '3_days', '1_day', 'due_today', 'overdue')),
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_task_reminder UNIQUE (task_id, reminder_type)
);

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- Stores in-app notification center alerts for deadline updates & reminders
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('upcoming', 'due_today', 'overdue', 'study_reminder', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS TABLE
-- Stores Web Push API subscriptions for background Service Worker notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_time ON public.study_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_reminders_task_type ON public.task_reminders(task_id, reminder_type);
CREATE INDEX IF NOT EXISTS idx_task_reminders_user ON public.task_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures that users can ONLY access, modify, and delete their own data.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- TASKS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- STUDY SESSIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own study sessions" ON public.study_sessions;
CREATE POLICY "Users can view own study sessions" ON public.study_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own study sessions" ON public.study_sessions;
CREATE POLICY "Users can insert own study sessions" ON public.study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own study sessions" ON public.study_sessions;
CREATE POLICY "Users can delete own study sessions" ON public.study_sessions FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- USER SETTINGS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- TASK REMINDERS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own task reminders" ON public.task_reminders;
CREATE POLICY "Users can view own task reminders" ON public.task_reminders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own task reminders" ON public.task_reminders;
CREATE POLICY "Users can insert own task reminders" ON public.task_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own task reminders" ON public.task_reminders;
CREATE POLICY "Users can delete own task reminders" ON public.task_reminders FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- PUSH SUBSCRIPTIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can upsert own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTOMATIC TRIGGER FOR NEW USERS
-- Automatically creates a profile and default settings when a user signs up.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default profile
    INSERT INTO public.profiles (user_id, full_name, avatar_url, study_goal, timezone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '👨‍🎓'),
        '4 hours / day',
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default user settings
    INSERT INTO public.user_settings (
        user_id,
        theme,
        timezone,
        study_duration,
        short_break_duration,
        long_break_duration,
        auto_start_break,
        auto_start_study,
        reminder_timing_7_days,
        reminder_timing_3_days,
        reminder_timing_1_day,
        reminder_timing_due_today,
        reminder_timing_overdue,
        notification_sound,
        browser_notifications_enabled
    )
    VALUES (
        NEW.id,
        'dark',
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
        45,
        10,
        20,
        false,
        false,
        true,
        true,
        true,
        true,
        true,
        true,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. UPDATED_AT TIMESTAMP HELPER TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

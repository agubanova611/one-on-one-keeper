// =====================================================
// DATABASE TYPES
// Type-safe definitions for Supabase tables
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// --------------------------------------------------------
// Database interface
// --------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      employees: {
        Row: Employee
        Insert: EmployeeInsert
        Update: EmployeeUpdate
      }
      meetings: {
        Row: Meeting
        Insert: MeetingInsert
        Update: MeetingUpdate
      }
      action_items: {
        Row: ActionItem
        Insert: ActionItemInsert
        Update: ActionItemUpdate
      }
      reminders: {
        Row: Reminder
        Insert: ReminderInsert
        Update: ReminderUpdate
      }
      meeting_topics: {
        Row: MeetingTopic
        Insert: MeetingTopicInsert
        Update: MeetingTopicUpdate
      }
    }
  }
}

// --------------------------------------------------------
// PROFILES
// --------------------------------------------------------
export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  email_notifications_enabled: boolean
  meeting_reminder_minutes: number
  action_item_reminder_days: number
  created_at: string
  updated_at: string
}

export interface ProfileInsert {
  id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email_notifications_enabled?: boolean
  meeting_reminder_minutes?: number
  action_item_reminder_days?: number
}

export interface ProfileUpdate {
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email_notifications_enabled?: boolean
  meeting_reminder_minutes?: number
  action_item_reminder_days?: number
}

// --------------------------------------------------------
// EMPLOYEES
// --------------------------------------------------------
export interface Employee {
  id: string
  user_id: string
  name: string
  role: string | null
  email: string | null
  avatar_url: string | null
  department: string | null
  notes: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface EmployeeInsert {
  id?: string
  user_id: string
  name: string
  role?: string | null
  email?: string | null
  avatar_url?: string | null
  department?: string | null
  notes?: string | null
  is_active?: boolean
  created_by?: string
}

export interface EmployeeUpdate {
  name?: string
  role?: string | null
  email?: string | null
  avatar_url?: string | null
  department?: string | null
  notes?: string | null
  is_active?: boolean
}

// --------------------------------------------------------
// MEETINGS
// --------------------------------------------------------
export type MeetingStatus = "scheduled" | "completed" | "cancelled"
export type MeetingType = "1:1" | "coaching" | "feedback" | "career" | "other"

export interface Meeting {
  id: string
  employee_id: string
  date: string
  time: string | null
  duration_minutes: number
  status: MeetingStatus
  notes: string | null
  meeting_type: MeetingType
  location: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface MeetingInsert {
  id?: string
  employee_id: string
  date: string
  time?: string | null
  duration_minutes?: number
  status?: MeetingStatus
  notes?: string | null
  meeting_type?: MeetingType
  location?: string | null
  created_by?: string
}

export interface MeetingUpdate {
  employee_id?: string
  date?: string
  time?: string | null
  duration_minutes?: number
  status?: MeetingStatus
  notes?: string | null
  meeting_type?: MeetingType
  location?: string | null
}

// --------------------------------------------------------
// ACTION ITEMS
// --------------------------------------------------------
export type ActionItemPriority = "low" | "medium" | "high"

export interface ActionItem {
  id: string
  meeting_id: string | null
  employee_id: string | null
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  priority: ActionItemPriority
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActionItemInsert {
  id?: string
  meeting_id?: string | null
  employee_id?: string | null
  title: string
  description?: string | null
  completed?: boolean
  due_date?: string | null
  priority?: ActionItemPriority
  assigned_to?: string | null
  created_by?: string
}

export interface ActionItemUpdate {
  title?: string
  description?: string | null
  completed?: boolean
  due_date?: string | null
  priority?: ActionItemPriority
  assigned_to?: string | null
  meeting_id?: string | null
  employee_id?: string | null
}

// --------------------------------------------------------
// REMINDERS
// --------------------------------------------------------
export type ReminderType = "meeting" | "action_item"

export interface Reminder {
  id: string
  user_id: string
  type: ReminderType
  reference_id: string
  remind_at: string
  sent: boolean
  sent_at: string | null
  created_at: string
}

export interface ReminderInsert {
  id?: string
  user_id: string
  type: ReminderType
  reference_id: string
  remind_at: string
  sent?: boolean
}

export interface ReminderUpdate {
  sent?: boolean
  sent_at?: string | null
  remind_at?: string
}

// --------------------------------------------------------
// MEETING TOPICS
// --------------------------------------------------------
export interface MeetingTopic {
  id: string
  meeting_id: string
  topic: string
  order_index: number
  is_covered: boolean
  notes: string | null
  created_at: string
}

export interface MeetingTopicInsert {
  id?: string
  meeting_id: string
  topic: string
  order_index?: number
  is_covered?: boolean
  notes?: string | null
}

export interface MeetingTopicUpdate {
  topic?: string
  order_index?: number
  is_covered?: boolean
  notes?: string | null
}

// --------------------------------------------------------
// JOINED TYPES
// More convenient types for UI components
// --------------------------------------------------------

export interface MeetingWithEmployee extends Meeting {
  employee: Employee
}

export interface MeetingWithDetails extends Meeting {
  employee: Employee
  action_items: ActionItem[]
  topics: MeetingTopic[]
}

export interface ActionItemWithDetails extends ActionItem {
  employee?: Employee
  meeting?: Meeting
}

// --------------------------------------------------------
// FORM DATA TYPES
// Types for form submissions
// --------------------------------------------------------

export interface EmployeeFormData {
  name: string
  role?: string
  email?: string
  avatar_url?: string
  department?: string
  notes?: string
}

export interface MeetingFormData {
  employee_id: string
  date: string
  time?: string
  duration_minutes: number
  status: MeetingStatus
  notes?: string
  meeting_type: MeetingType
  location?: string
}

export interface ActionItemFormData {
  title: string
  description?: string
  due_date?: string
  priority: ActionItemPriority
  assigned_to?: string
  meeting_id?: string
  employee_id?: string
}

export interface ProfileFormData {
  full_name?: string
  avatar_url?: string
  email_notifications_enabled?: boolean
  meeting_reminder_minutes?: number
  action_item_reminder_days?: number
}

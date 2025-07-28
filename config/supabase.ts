import { createClient } from '@supabase/supabase-js';

// Your actual Supabase project credentials
const supabaseUrl = 'https://dyxbiedbzepqihaipatc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5eGJpZWRiemVwcWloYWlwYXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODQzMTAsImV4cCI6MjA2OTI2MDMxMH0.Pm8WyysMDDLeNuDIOLBDpwgTWiFDXoxKrn8GjcFzO-A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (we'll expand these as needed)
export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  name: string;
  is_group: boolean;
  participants: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  text: string;
  image_url?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}
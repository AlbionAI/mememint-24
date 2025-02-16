
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ouvhbnbdczqpyvtkonzg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91dmhibmJkY3pxcHl2dGtvbnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2OTkyODAsImV4cCI6MjA1NTI3NTI4MH0.Z6SkgHJcY2_URLvNQWcqz9WSKvAMM2W1p_vxZn9VQvo";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

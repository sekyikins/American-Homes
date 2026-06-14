import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Mobile app: Supabase env variables are missing. Please check the .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;

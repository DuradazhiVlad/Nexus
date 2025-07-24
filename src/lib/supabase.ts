import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gtfgvqttfydelzgvgwly.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Zmd2cXR0ZnlkZWx6Z3Znd2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjE0OTEsImV4cCI6MjA1OTU5NzQ5MX0.nBdVMHZ6LJ8ZvdSuXk_uDVMb6DxB5iTeFdc0dM7zolI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'nexus-supabase-auth'
  },
  global: {
    headers: { 'x-my-custom-header': 'nexus-app' },
  },
}); 
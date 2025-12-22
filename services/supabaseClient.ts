import { createClient } from '@supabase/supabase-js'

// Using provided Supabase credentials
const supabaseUrl = 'https://ohhvlavljhftshlbzqbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaHZsYXZsamhmdHNobGJ6cWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjk0OTgsImV4cCI6MjA4MTk0NTQ5OH0.dlVlqLSRItUiRO8xMS7c6gTBeV-zn-uzeWnCyKvtL6E';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Data persistence will be disabled.");
}

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
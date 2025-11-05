
// import { createClient } from '@supabase/supabase-js'

// // The execution environment provides environment variables via `process.env`.
// // This matches the pattern used for the Gemini API Key in other parts of the app.
// const supabaseUrl = process.env.VITE_SUPABASE_URL
// const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

// if (!supabaseUrl || !supabaseKey) {
//   // This error will be thrown if the environment variables are not set.
//   throw new Error("Supabase credentials missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your project's Environment Variables.")
// }

// export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase has been disabled as per the user's request.
export const supabase = null;
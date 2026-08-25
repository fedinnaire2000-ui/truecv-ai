import { createClient } from "@supabase/supabase-js";

// The anon/publishable key is designed to be safely exposed in client-side code.
// Access control is enforced server-side by Supabase's Row Level Security (RLS).
const SUPABASE_URL = "https://anebffaxqczdrmfjwyfl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FC3RU53C_CKqs5PDKIQejQ_tN6yqzJ5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

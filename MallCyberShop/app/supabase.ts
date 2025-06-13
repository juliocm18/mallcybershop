import AsyncStorage from "@react-native-async-storage/async-storage";
import {createClient} from "@supabase/supabase-js";

export const SUPABASE_URL = "https://mtmikpoblfslzhastcyj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bWlrcG9ibGZzbHpoYXN0Y3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMjk4NDQsImV4cCI6MjA1MjkwNTg0NH0.cELpUKe4dwzEbCnqJ3aOYITRXs-ofd92I9vFVEyHv3o";

//export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // No custom fetch overrides - let it use native fetch
});

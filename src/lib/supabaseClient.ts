import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://veqqvqnhmhfhxwniuzvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcXF2cW5obWhmaHh3bml1enZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkwMDUsImV4cCI6MjA4ODIxNTAwNX0.-6HTKxQwHOdA5f9l6fAYJEh-hj2Q00KsqoDeC0boJNA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

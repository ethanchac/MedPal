import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    "https://defgyqqvrnmcypeudatg.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmd5cXF2cm5tY3lwZXVkYXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDI1NzEsImV4cCI6MjA3OTc3ODU3MX0.BED0N5Wm1sTc4wNZ9FF5eCyLfsmEpwj0l6RzvzcbSos"
);
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    "https://iemnwzfxutrbtlffneto.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllbW53emZ4dXRyYnRsZmZuZXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNzQ1NjYsImV4cCI6MjA2NjY1MDU2Nn0.wc2OmEbQC_x4XJKUJK6lRv_IqmNqSw-P8vDQbo94i68"
);
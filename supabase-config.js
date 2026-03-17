import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kygvlglmguipqtpyjbqp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Z3ZsZ2xtZ3VpcHF0cHlqYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDkzMTMsImV4cCI6MjA4OTA4NTMxM30.wd6Zuladi-BnmZI-LedRh1L35B7rC7tasRXDAPPNNbc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
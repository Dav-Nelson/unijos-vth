import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Server-only admin client — uses the service role key and bypasses all RLS.
// Import ONLY in Server Actions and Server Components. Never in client components.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

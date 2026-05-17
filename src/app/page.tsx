import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Read role from users table — not app_metadata
  // app_metadata is not reliably set for all accounts
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const LANDING: Record<string, string> = {
    RECEPTIONIST: '/queue',
    STUDENT:      '/cases',
    INTERN:       '/cases',
    RESIDENT_VET: '/approvals',
    LECTURER:     '/approvals',
    CONSULTANT:   '/approvals',
    PROFESSOR:    '/approvals',
    PHARMACIST:   '/formulary',
    ADMIN:        '/admin',
  }

  redirect(LANDING[profile.role] ?? '/queue')
}
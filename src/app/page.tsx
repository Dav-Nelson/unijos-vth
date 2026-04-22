import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role as string

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

  redirect(LANDING[role] ?? '/login')
}

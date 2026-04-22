import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReceptionistShell from '@/components/receptionist-shell'

export default async function QueueLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.app_metadata?.role !== 'RECEPTIONIST') redirect('/login')

  const [profileResult, clinicResult] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('clinics').select('name').eq('id', user.app_metadata.clinic_id).single(),
  ])

  return (
    <ReceptionistShell
      userName={profileResult.data?.full_name ?? ''}
      clinicName={clinicResult.data?.name ?? ''}
    >
      {children}
    </ReceptionistShell>
  )
}

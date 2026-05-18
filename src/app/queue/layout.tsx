import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReceptionistShell from '@/components/receptionist-shell'

export default async function QueueLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Read role from users table — not app_metadata
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, clinic_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'RECEPTIONIST') redirect('/login')
  if (!profile.clinic_id) redirect('/login')

  // Get clinic name from clinic_id in users table
  const { data: clinic } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', profile.clinic_id)
    .single()

  return (
    <ReceptionistShell
      userName={profile.full_name ?? ''}
      clinicName={clinic?.name ?? ''}
    >
      {children}
    </ReceptionistShell>
  )
}
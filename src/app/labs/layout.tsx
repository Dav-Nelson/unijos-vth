import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LabShell from '@/components/lab-shell'

const ALLOWED_ROLES = [
  'STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
  'CONSULTANT', 'PROFESSOR', 'ADMIN',
]

export default async function LabsLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!ALLOWED_ROLES.includes(profile.role)) redirect('/cases')

  return (
    <LabShell userName={profile.full_name ?? ''} role={profile.role}>
      {children}
    </LabShell>
  )
}
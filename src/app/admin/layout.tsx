import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminShell from './_components/admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client so we can read the profile regardless of RLS
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect('/login')

  return (
    <AdminShell userName={profile.full_name}>
      {children}
    </AdminShell>
  )
}

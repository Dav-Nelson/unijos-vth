'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRotation(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('rotations')
    .select('id')
    .eq('student_id', data.student_id)
    .lte('start_date', data.end_date)
    .gte('end_date', data.start_date)

  if (conflicts && conflicts.length > 0) {
    return { success: false, error: 'Student already has a rotation in this date range.' }
  }

  const { error } = await supabase.from('rotations').insert({
    ...data,
    created_by: user.id
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteRotation(id: string) {
  const supabase = await createClient()
  await supabase.from('rotations').delete().eq('id', id)
  revalidatePath('/admin/rotations')
}

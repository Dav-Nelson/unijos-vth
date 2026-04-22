'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/navigation'

export async function submitClinicalRecord(caseId: string, values: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get or create clinical record
  const { data: record, error: fetchErr } = await supabase
    .from('clinical_records')
    .select('id, status')
    .eq('case_id', caseId)
    .maybeSingle()

  if (fetchErr) return { success: false, error: 'Database error' }

  // 2. Perform submission update
  // Logic: Draft/Rejected -> PENDING_REVIEW
  if (!record) {
    const { error: insertErr } = await supabase.from('clinical_records').insert({
      case_id: caseId,
      author_id: user.id,
      status: 'PENDING_REVIEW',
      ...values,
    })
    if (insertErr) return { success: false, error: 'Failed to create and submit' }
  } else {
    if (record.status !== 'DRAFT' && record.status !== 'REJECTED') {
      return { success: false, error: 'Record is already submitted or locked' }
    }
    const { error: updateErr } = await supabase
      .from('clinical_records')
      .update({
        status: 'PENDING_REVIEW',
        ...values,
      })
      .eq('id', record.id)
    if (updateErr) return { success: false, error: 'Failed to submit' }
  }

  revalidatePath(`/cases/${caseId}/clinical`)
  revalidatePath('/approvals')
  return { success: true }
}

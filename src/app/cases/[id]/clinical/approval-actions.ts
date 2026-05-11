'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function approveClinicalRecord(recordId: string, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get record and hash its content
  const { data: record, error: fetchErr } = await supabase
    .from('clinical_records')
    .select('*')
    .eq('id', recordId)
    .single()

  if (fetchErr || !record) return { success: false, error: 'Record not found' }

  // Calculate hash of clinical fields
  const content = JSON.stringify({
    chief_complaint: record.chief_complaint,
    history: record.history,
    examination_findings: record.examination_findings,
    diagnosis: record.diagnosis,
    treatment_plan: record.treatment_plan,
    prescriptions: record.prescriptions,
    approved_by_vet_id: user.id,
    approved_at: new Date().toISOString()
  })
  const hash = crypto.createHash('sha256').update(content).digest('hex')

  // 2. Atomic transition: PENDING_REVIEW -> LOCKED + Create Approval Record
  // Note: This relies on Supabase transaction (all operations in one promise or RPC)
  // For standard JS client, we use a sequential flow or RPC. Using RPC is better for atomicity.
  
  const { error: txErr } = await supabase.rpc('approve_clinical_record', {
    p_record_id: recordId,
    p_vet_id: user.id,
    p_note: note || null,
    p_hash: hash
  } as any)

  if (txErr) return { success: false, error: txErr.message }

  revalidatePath(`/cases/${record.case_id}/clinical`)
  revalidatePath('/approvals')
  return { success: true }
}

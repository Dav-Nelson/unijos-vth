'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createInvoice(caseId: string, type: 'STANDARD' | 'AMBULATORY', estimatedTotal?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      case_id: caseId,
      invoice_type: type,
      status: type === 'AMBULATORY' ? 'ESTIMATED' : 'PENDING',
      estimated_total: estimatedTotal,
      created_by: user.id
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/cases/${caseId}`)
  return { success: true, invoiceId: data.id }
}

export async function recordPayment(invoiceId: string, amount: number, method: 'CASH' | 'BANK_TRANSFER', type: 'DEPOSIT' | 'FINAL' | 'FULL') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Generate unique receipt number
  const receiptNumber = `VTH-RCPT-${Date.now()}`

  const { error } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      payment_type: type,
      amount,
      method,
      recorded_by: user.id,
      receipt_number: receiptNumber
    })

  if (error) return { success: false, error: error.message }
  
  revalidatePath(`/billing/invoices/${invoiceId}`)
  return { success: true }
}

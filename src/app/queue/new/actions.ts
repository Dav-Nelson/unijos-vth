'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Owner lookup ───────────────────��───────────────────────────────────────────
export async function lookupOwner(phone: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('owners')
    .select('id, full_name, phone, address')
    .eq('phone', phone.trim())
    .maybeSingle()
  return data
}

// ── Create appointment ─────────────────────────────────────────────────────────
const schema = z.object({
  // Owner — either existing id or new owner fields
  owner_id:      z.string().uuid().optional(),
  owner_name:    z.string().min(2).optional(),
  owner_phone:   z.string().min(7).optional(),
  owner_address: z.string().optional(),
  // Appointment details
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().min(1, 'Time is required'),
  chief_complaint: z.string().min(2, 'Chief complaint is required'),
  notes: z.string().optional(),
})

export type ScheduleInput = z.infer<typeof schema>
export type ScheduleResult = { error: string } | { success: true }

export async function scheduleAppointment(input: ScheduleInput): Promise<ScheduleResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired' }

  const clinicId = user.app_metadata?.clinic_id as string
  if (!clinicId) return { error: 'No clinic assigned to your account' }

  const { owner_id, owner_name, owner_phone, owner_address,
          scheduled_date, scheduled_time, chief_complaint, notes } = parsed.data

  // Step 1: Resolve owner (existing or create new)
  let resolvedOwnerId = owner_id
  if (!resolvedOwnerId) {
    if (!owner_name || !owner_phone) return { error: 'Owner name and phone are required' }
    const { data: newOwner, error: ownerErr } = await supabase
      .from('owners')
      .insert({ full_name: owner_name, phone: owner_phone.trim(), address: owner_address || null })
      .select('id')
      .single()
    if (ownerErr) return { error: ownerErr.message }
    resolvedOwnerId = newOwner.id
  }

  // Step 2: Build scheduled_at from date + time inputs
  const scheduledAt = new Date(`${scheduled_date}T${scheduled_time}:00`)

  // Step 3: Insert appointment
  const { error: apptErr } = await supabase.from('appointments').insert({
    clinic_id: clinicId,
    owner_id: resolvedOwnerId,
    created_by: user.id,
    scheduled_at: scheduledAt.toISOString(),
    status: 'SCHEDULED',
    chief_complaint,
    notes: notes || null,
  })

  if (apptErr) return { error: apptErr.message }

  revalidatePath('/queue')
  return { success: true }
}

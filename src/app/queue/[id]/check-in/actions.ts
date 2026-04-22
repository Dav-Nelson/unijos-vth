'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  appointment_id: z.string().uuid(),
  case_type:      z.enum(['IN_CLINIC', 'AMBULATORY']),
  // Patient fields (INDIVIDUAL — Form A)
  species:        z.string().min(1, 'Species is required'),
  breed:          z.string().optional(),
  age_months:     z.coerce.number().int().min(0).optional().nullable(),
  weight_kg:      z.coerce.number().min(0).optional().nullable(),
  sex:            z.enum(['M', 'F', 'UNKNOWN']).optional().nullable(),
  // Ambulatory extra fields
  farm_location:  z.string().optional(),
  travel_fee:     z.coerce.number().min(0).optional().nullable(),
}).refine(data => {
  if (data.case_type === 'AMBULATORY') {
    return !!data.farm_location && data.travel_fee != null
  }
  return true
}, { message: 'Farm location and travel fee are required for ambulatory cases', path: ['farm_location'] })

export async function checkIn(formData: FormData) {
  const raw = Object.fromEntries(formData.entries())
  const parsed = schema.safeParse({
    ...raw,
    age_months: raw.age_months || null,
    weight_kg:  raw.weight_kg  || null,
    sex:        raw.sex        || null,
    travel_fee: raw.travel_fee || null,
  })

  if (!parsed.success) {
    // Return errors to client — server actions that use <form action> must redirect or return
    // We'll encode the error in a redirect for simplicity
    redirect(`/queue/${raw.appointment_id}/check-in?error=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const { appointment_id, case_type, species, breed, age_months, weight_kg, sex,
          farm_location, travel_fee } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch appointment to get owner_id and clinic_id
  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .select('owner_id, clinic_id, status')
    .eq('id', appointment_id)
    .single()

  if (apptErr || !appt) redirect(`/queue/${appointment_id}/check-in?error=Appointment+not+found`)
  if (appt.status === 'CHECKED_IN') redirect(`/queue?info=Already+checked+in`)

  // 1. Create the case
  const { data: newCase, error: caseErr } = await supabase
    .from('cases')
    .insert({
      patient_type: 'INDIVIDUAL',
      case_type,
      clinic_id: appt.clinic_id,
      owner_id: appt.owner_id,
    })
    .select('id')
    .single()

  if (caseErr || !newCase) redirect(`/queue/${appointment_id}/check-in?error=${encodeURIComponent(caseErr?.message ?? 'Failed to create case')}`)

  // 2. Create patient record
  await supabase.from('individual_patients').insert({
    case_id:    newCase.id,
    species,
    breed:      breed || null,
    age_months: age_months ?? null,
    weight_kg:  weight_kg  ?? null,
    sex:        sex        ?? null,
  })

  // 3. If ambulatory, create trip record
  if (case_type === 'AMBULATORY' && farm_location && travel_fee != null) {
    await supabase.from('ambulatory_trips').insert({
      case_id: newCase.id,
      farm_location,
      travel_fee,
    })
  }

  // 4. Update appointment: CHECKED_IN + link case_id
  await supabase
    .from('appointments')
    .update({ status: 'CHECKED_IN', case_id: newCase.id })
    .eq('id', appointment_id)

  redirect(`/cases/${newCase.id}`)
}

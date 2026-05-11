'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAvianCase(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Get or create owner
  let { data: owner } = await supabase
    .from('owners')
    .select('id')
    .eq('phone', data.owner_phone)
    .maybeSingle()

  if (!owner) {
    const { data: newOwner, error } = await supabase
      .from('owners')
      .insert({ full_name: data.owner_name, phone: data.owner_phone })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    owner = newOwner
  }

  // 2. Create case
  const { data: newCase, error: caseErr } = await supabase
    .from('cases')
    .insert({
      patient_type: data.category,
      case_type: 'IN_CLINIC',
      clinic_id: user.app_metadata?.clinic_id,
      owner_id: owner.id,
      status: 'OPEN',
    })
    .select('id')
    .single()

  if (caseErr) return { success: false, error: caseErr.message }

  // 3. Create specific patient record
  const table = data.category === 'FLOCK' ? 'flock_patients' : 
                data.category === 'POUND' ? 'pound_patients' : 'individual_patients'
  
  const patientData: any = {
    case_id: newCase.id,
    species: data.species,
  }
  
  if (data.category === 'FLOCK') {
      patientData.flock_size = data.flock_size
      patientData.sick_count = data.sick_count
      patientData.avg_weight_kg = data.avg_weight_kg
      patientData.housing_type = data.housing_type
  } else if (data.category === 'POUND') {
      patientData.pond_size_m2 = data.pond_size_m2
      patientData.fish_count_estimate = data.fish_count_estimate
  } else if (data.category === 'INDIVIDUAL_EXOTIC') {
      patientData.age_months = data.age_months
      patientData.weight_kg = data.weight_kg
  }

  await supabase.from(table).insert(patientData)

  revalidatePath('/queue')
  return { success: true }
}

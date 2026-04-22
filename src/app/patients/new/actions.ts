'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/navigation'

export async function createPatientCase(input: any) {
  const supabase = await createClient()

  // 1. Handle Owner Deduplication
  let { data: owner, error: ownerSearchError } = await supabase
    .from('owners')
    .select('id')
    .eq('phone', input.owner_phone)
    .maybeSingle()

  if (ownerSearchError) return { success: false, error: 'Database error searching for owner' }

  if (!owner) {
    const { data: newOwner, error: createOwnerError } = await supabase
      .from('owners')
      .insert({
        full_name: input.owner_name,
        phone: input.owner_phone,
        address: input.owner_address,
      })
      .select('id')
      .single()

    if (createOwnerError) return { success: false, error: 'Failed to create owner' }
    owner = newOwner
  }

  // 2. Insert Case
  // Note: Clinic ID will need to be fetched from the user's session or passed from UI
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { success: false, error: 'Unauthorized' }
  
  const clinicId = userData.user.app_metadata?.clinic_id
  if (!clinicId) return { success: false, error: 'Clinic context missing' }

  const { data: newCase, error: createCaseError } = await supabase
    .from('cases')
    .insert({
      patient_type: 'INDIVIDUAL',
      case_type: input.is_ambulatory ? 'AMBULATORY' : 'IN_CLINIC',
      clinic_id: clinicId,
      owner_id: owner.id,
      status: 'OPEN',
    })
    .select('id')
    .single()

  if (createCaseError) return { success: false, error: 'Failed to create case' }

  // 3. Insert Patient Detail (Individual)
  const { error: createPatientError } = await supabase
    .from('individual_patients')
    .insert({
      case_id: newCase.id,
      species: input.species,
      breed: input.breed,
      age_months: (input.age_years || 0) * 12 + (input.age_months || 0),
      weight_kg: input.weight_kg,
      sex: input.sex,
    })

  if (createPatientError) return { success: false, error: 'Failed to create patient details' }

  // 4. Handle Ambulatory Trip
  if (input.is_ambulatory) {
    await supabase.from('ambulatory_trips').insert({
      case_id: newCase.id,
      farm_location: input.farm_location || 'Unknown',
      travel_fee: input.travel_fee || 0,
    })
  }

  revalidatePath('/queue')
  return { success: true, caseId: newCase.id }
}

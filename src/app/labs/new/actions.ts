'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Maps request type to which lab handles it
const TYPE_TO_LAB_TYPE: Record<string, string> = {
  CYTOLOGY:                'PATHOLOGY',
  HAEMATOLOGY:             'PATHOLOGY',
  BACTERIOLOGY_MYCOLOGY:   'MICROBIOLOGY',
  PARASITOLOGY_ENTOMOLOGY: 'PARASITOLOGY',
}

export async function submitLabRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string
  const allowedRoles = ['STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'RECEPTIONIST']
  if (!allowedRoles.includes(role)) redirect('/login')

  const caseId      = formData.get('case_id')      as string
  const requestType = formData.get('request_type') as string

  if (!caseId || !requestType) {
    redirect(`/labs/new?case_id=${caseId}&error=missing_fields`)
  }

  // Look up the lab by type
  const labType = TYPE_TO_LAB_TYPE[requestType]
  const { data: lab } = await supabase
    .from('labs')
    .select('id')
    .eq('lab_type', labType)
    .single()

  if (!lab) {
    redirect(`/labs/new?case_id=${caseId}&error=lab_not_found`)
  }

  const { data: inserted, error } = await supabase
    .from('lab_requests')
    .insert({
      case_id:                caseId,
      lab_id:                 lab.id,
      request_type:           requestType as 'CYTOLOGY' | 'HAEMATOLOGY' | 'BACTERIOLOGY_MYCOLOGY' | 'PARASITOLOGY_ENTOMOLOGY',
      previous_lab_number:    (formData.get('previous_lab_number') as string) || null,
      clinician_id:           user.id,
      date_of_collection:     (formData.get('date_of_collection') as string) || null,
      specimen:               (formData.get('specimen') as string) || null,
      history_clinical_signs: (formData.get('history_clinical_signs') as string) || null,
      tentative_diagnosis:    (formData.get('tentative_diagnosis') as string) || null,
      investigation_required: (formData.get('investigation_required') as string) || null,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    redirect(`/labs/new?case_id=${caseId}&error=${encodeURIComponent(error?.message ?? 'insert_failed')}`)
  }

  redirect(`/labs/${inserted.id}?created=1`)
}

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const VET_ROLES = ['RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN']

// ── Cytology ────────────────────────────────────────────────────────────────

export async function saveCytologyResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!VET_ROLES.includes(user.app_metadata?.role)) redirect('/login')

  const requestId = formData.get('request_id') as string

  await supabase
    .from('cytology_results')
    .upsert({
      lab_request_id:        requestId,
      cytology_report:       (formData.get('cytology_report')       as string) || null,
      cytological_diagnosis: (formData.get('cytological_diagnosis') as string) || null,
      recommendations:       (formData.get('recommendations')       as string) || null,
      pathologist_id:        user.id,
      reported_at:           new Date().toISOString(),
    }, { onConflict: 'lab_request_id' })

  await supabase
    .from('lab_requests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', requestId)

  redirect(`/labs/${requestId}?saved=1`)
}

// ── Haematology ──────────────────────────────────────────────────────────────

export async function saveHaematologyResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!VET_ROLES.includes(user.app_metadata?.role)) redirect('/login')

  const requestId = formData.get('request_id') as string

  const num = (key: string) => {
    const v = formData.get(key) as string
    return v ? parseFloat(v) : null
  }
  const txt = (key: string) => (formData.get(key) as string) || null

  await supabase
    .from('haematology_results')
    .upsert({
      lab_request_id:         requestId,
      // Plasma
      plasma_colour:          txt('plasma_colour'),
      plasma_protein_gdl:     num('plasma_protein_gdl'),
      fibrinogen_gdl:         num('fibrinogen_gdl'),
      // Erythrocytes
      hb_gdl:                 num('hb_gdl'),
      pcv_pct:                num('pcv_pct'),
      rbc_x10_6_ul:           num('rbc_x10_6_ul'),
      mcv_fl:                 num('mcv_fl'),
      mchc_gdl:               num('mchc_gdl'),
      reticulocytosis:        txt('reticulocytosis'),
      platelets:              txt('platelets'),
      // Blood smear
      anisocytosis:           txt('anisocytosis'),
      poikilocytosis:         txt('poikilocytosis'),
      microcytosis:           txt('microcytosis'),
      macrocytosis:           txt('macrocytosis'),
      spherocytosis:          txt('spherocytosis'),
      leptocytosis:           txt('leptocytosis'),
      polychromatophilia:     txt('polychromatophilia'),
      howell_jolly_bodies:    txt('howell_jolly_bodies'),
      rouleaux_formation:     txt('rouleaux_formation'),
      red_cell_agglutination: txt('red_cell_agglutination'),
      // Leucocytes
      total_wbc_x10_3_ul:     num('total_wbc_x10_3_ul'),
      // Differential
      seg_neutrophils_pct:    num('seg_neutrophils_pct'),
      seg_neutrophils_abs:    num('seg_neutrophils_abs'),
      band_neutrophils_pct:   num('band_neutrophils_pct'),
      band_neutrophils_abs:   num('band_neutrophils_abs'),
      lymphocytes_pct:        num('lymphocytes_pct'),
      lymphocytes_abs:        num('lymphocytes_abs'),
      monocytes_pct:          num('monocytes_pct'),
      monocytes_abs:          num('monocytes_abs'),
      eosinophils_pct:        num('eosinophils_pct'),
      eosinophils_abs:        num('eosinophils_abs'),
      basophils_pct:          num('basophils_pct'),
      basophils_abs:          num('basophils_abs'),
      // Parasites
      parasites_wet_mount:    txt('parasites_wet_mount'),
      parasites_buffy_coat:   txt('parasites_buffy_coat'),
      parasites_blood_smear:  txt('parasites_blood_smear'),
      // Interpretation
      interpretation:         txt('interpretation'),
      pathologist_id:         user.id,
      reported_at:            new Date().toISOString(),
    }, { onConflict: 'lab_request_id' })

  await supabase
    .from('lab_requests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', requestId)

  redirect(`/labs/${requestId}?saved=1`)
}

// ── Bacteriology & Mycology ──────────────────────────────────────────────────

export async function saveBacteriologyResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!VET_ROLES.includes(user.app_metadata?.role)) redirect('/login')

  const requestId = formData.get('request_id') as string

  await supabase
    .from('bacteriology_results')
    .upsert({
      lab_request_id:           requestId,
      specimens_for_examination:(formData.get('specimens_for_examination') as string) || null,
      investigation_required:   (formData.get('investigation_required')    as string) || null,
      laboratory_findings:      (formData.get('laboratory_findings')       as string) || null,
      technologist_id:          user.id,
      veterinarian_id:          user.id,
      reported_at:              new Date().toISOString(),
    }, { onConflict: 'lab_request_id' })

  await supabase
    .from('lab_requests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', requestId)

  redirect(`/labs/${requestId}?saved=1`)
}

// ── Parasitology & Entomology ────────────────────────────────────────────────

export async function saveParasitologyResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!VET_ROLES.includes(user.app_metadata?.role)) redirect('/login')

  const requestId = formData.get('request_id') as string

  const sampleTypes    = formData.getAll('sample_types')    as string[]
  const testsRequested = formData.getAll('tests_requested') as string[]

  await supabase
    .from('parasitology_results')
    .upsert({
      lab_request_id:                   requestId,
      sample_types:                     sampleTypes.length   ? sampleTypes   : null,
      endo_ectoparasite_retrieval_site: (formData.get('endo_ectoparasite_retrieval_site') as string) || null,
      sample_type_other:                (formData.get('sample_type_other')                as string) || null,
      tests_requested:                  testsRequested.length ? testsRequested : null,
      test_other:                       (formData.get('test_other')                       as string) || null,
      anti_parasite_treatment:          (formData.get('anti_parasite_treatment')          as string) || null,
      laboratory_result:                (formData.get('laboratory_result')                as string) || null,
      diagnostician_id:                 user.id,
      reported_at:                      new Date().toISOString(),
    }, { onConflict: 'lab_request_id' })

  await supabase
    .from('lab_requests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', requestId)

  redirect(`/labs/${requestId}?saved=1`)
}

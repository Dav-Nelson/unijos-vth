import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  saveCytologyResult,
  saveHaematologyResult,
  saveBacteriologyResult,
  saveParasitologyResult,
} from './actions'

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  CYTOLOGY:                'Cytology',
  HAEMATOLOGY:             'Haematology (CBC)',
  BACTERIOLOGY_MYCOLOGY:   'Bacteriology & Mycology',
  PARASITOLOGY_ENTOMOLOGY: 'Parasitology & Entomology',
}

const STATUS_COLOURS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-green-100 text-green-700',
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{String(value)}</p>
    </div>
  )
}

function Textarea({
  name, label, defaultValue, rows = 3, required,
}: {
  name: string; label: string; defaultValue?: string | null; rows?: number; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ''}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
          focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
      />
    </div>
  )
}

function NumInput({
  name, label, defaultValue, unit,
}: {
  name: string; label: string; defaultValue?: number | null; unit?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}{unit && <span className="text-slate-400 font-normal ml-1">({unit})</span>}
      </label>
      <input
        type="number"
        step="any"
        name={name}
        defaultValue={defaultValue ?? ''}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
          focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  )
}

function TextInput({
  name, label, defaultValue, placeholder,
}: {
  name: string; label: string; defaultValue?: string | null; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
          placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LabRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; created?: string }>
}) {
  const { id }            = await params
  const { saved, created } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string
  const isVet = ['RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR', 'ADMIN'].includes(role)

  // Load request + related data
  const { data: req } = await supabase
    .from('lab_requests')
    .select('*, cases(case_number, owners(full_name)), labs(name)')
    .eq('id', id)
    .single()

  if (!req) notFound()

  const c     = req.cases as { case_number: string; owners: { full_name: string } | null } | null
  const lab   = req.labs  as { name: string } | null
  const owner = c?.owners as { full_name: string } | null

  // Load existing result (if any)
  let cytology:     Record<string, unknown> | null = null
  let haematology:  Record<string, unknown> | null = null
  let bacteriology: Record<string, unknown> | null = null
  let parasitology: Record<string, unknown> | null = null

  const type = req.request_type

  if (type === 'CYTOLOGY') {
    const { data } = await supabase.from('cytology_results').select('*').eq('lab_request_id', id).maybeSingle()
    cytology = data
  } else if (type === 'HAEMATOLOGY') {
    const { data } = await supabase.from('haematology_results').select('*').eq('lab_request_id', id).maybeSingle()
    haematology = data
  } else if (type === 'BACTERIOLOGY_MYCOLOGY') {
    const { data } = await supabase.from('bacteriology_results').select('*').eq('lab_request_id', id).maybeSingle()
    bacteriology = data
  } else if (type === 'PARASITOLOGY_ENTOMOLOGY') {
    const { data } = await supabase.from('parasitology_results').select('*').eq('lab_request_id', id).maybeSingle()
    parasitology = data
  }


  const isCompleted = req.status === 'COMPLETED'

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link href="/labs" className="text-xs text-slate-400 hover:text-slate-600 mb-4 inline-block">
        ← Lab Requests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{req.lab_number}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${STATUS_COLOURS[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {req.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {TYPE_LABELS[type]} · {lab?.name ?? '—'} ·{' '}
            Case <span className="font-mono">{c?.case_number ?? '—'}</span>
            {owner && <> · {owner.full_name}</>}
          </p>
        </div>
        <Link
          href={`/cases/${req.case_id}`}
          className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5
            rounded-md hover:bg-slate-50 transition-colors"
        >
          View Case
        </Link>
      </div>

      {/* Banners */}
      {created && (
        <div className="bg-teal-50 border border-teal-200 rounded-md px-4 py-2 mb-4">
          <p className="text-xs text-teal-700">
            Request submitted — Lab No. <span className="font-mono font-semibold">{req.lab_number}</span>
          </p>
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-4">
          <p className="text-xs text-green-700">Results saved.</p>
        </div>
      )}

      {/* Request info card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Request Details
        </h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Specimen"             value={req.specimen} />
          <Field label="Date of Collection"   value={req.date_of_collection
            ? new Date(req.date_of_collection).toLocaleString('en-NG') : null} />
          <Field label="Previous Lab No."     value={req.previous_lab_number} />
          <Field label="Requested"            value={new Date(req.requested_at).toLocaleString('en-NG')} />
          {req.history_clinical_signs && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">History &amp; Clinical Signs</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{req.history_clinical_signs}</p>
            </div>
          )}
          {req.tentative_diagnosis && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Tentative Diagnosis</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{req.tentative_diagnosis}</p>
            </div>
          )}
          {req.investigation_required && (
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Investigation Required</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{req.investigation_required}</p>
            </div>
          )}
        </div>
      </div>

      {/* Result section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          {TYPE_LABELS[type]} Report
        </h2>

        {/* ── CYTOLOGY ── */}
        {type === 'CYTOLOGY' && (
          isCompleted && cytology ? (
            <div className="space-y-3">
              <Field label="Cytology Report"       value={String(cytology.cytology_report ?? '')} />
              <Field label="Cytological Diagnosis" value={String(cytology.cytological_diagnosis ?? '')} />
              <Field label="Recommendations"       value={String(cytology.recommendations ?? '')} />
              <p className="text-xs text-slate-400">
                Reported {cytology.reported_at ? new Date(String(cytology.reported_at)).toLocaleString('en-NG') : ''}
              </p>
            </div>
          ) : isVet ? (
            <form action={saveCytologyResult} className="space-y-4">
              <input type="hidden" name="request_id" value={id} />
              <Textarea name="cytology_report"       label="Cytology Report"       defaultValue={cytology?.cytology_report as string} rows={5} />
              <Textarea name="cytological_diagnosis" label="Cytological Diagnosis" defaultValue={cytology?.cytological_diagnosis as string} rows={2} />
              <Textarea name="recommendations"       label="Recommendations"       defaultValue={cytology?.recommendations as string} rows={3} />
              <SubmitBtn />
            </form>
          ) : (
            <Pending />
          )
        )}

        {/* ── HAEMATOLOGY ── */}
        {type === 'HAEMATOLOGY' && (
          isCompleted && haematology ? (
            <HaematologyReadOnly h={haematology} />
          ) : isVet ? (
            <form action={saveHaematologyResult} className="space-y-6">
              <input type="hidden" name="request_id" value={id} />
              <HaematologyForm h={haematology} />
              <SubmitBtn />
            </form>
          ) : (
            <Pending />
          )
        )}

        {/* ── BACTERIOLOGY & MYCOLOGY ── */}
        {type === 'BACTERIOLOGY_MYCOLOGY' && (
          isCompleted && bacteriology ? (
            <div className="space-y-3">
              <Field label="Specimens for Examination" value={String(bacteriology.specimens_for_examination ?? '')} />
              <Field label="Investigation Required"    value={String(bacteriology.investigation_required ?? '')} />
              <Field label="Laboratory Findings"       value={String(bacteriology.laboratory_findings ?? '')} />
              <p className="text-xs text-slate-400">
                Reported {bacteriology.reported_at ? new Date(String(bacteriology.reported_at)).toLocaleString('en-NG') : ''}
              </p>
            </div>
          ) : isVet ? (
            <form action={saveBacteriologyResult} className="space-y-4">
              <input type="hidden" name="request_id" value={id} />
              <Textarea name="specimens_for_examination" label="Specimens for Examination"
                defaultValue={bacteriology?.specimens_for_examination as string} rows={2} />
              <Textarea name="investigation_required"    label="Investigation Required"
                defaultValue={bacteriology?.investigation_required as string} rows={2} />
              <Textarea name="laboratory_findings"       label="Laboratory Findings &amp; Result"
                defaultValue={bacteriology?.laboratory_findings as string} rows={6} />
              <SubmitBtn />
            </form>
          ) : (
            <Pending />
          )
        )}

        {/* ── PARASITOLOGY & ENTOMOLOGY ── */}
        {type === 'PARASITOLOGY_ENTOMOLOGY' && (
          isCompleted && parasitology ? (
            <ParasitologyReadOnly p={parasitology} />
          ) : isVet ? (
            <form action={saveParasitologyResult} className="space-y-6">
              <input type="hidden" name="request_id" value={id} />
              <ParasitologyForm p={parasitology} />
              <SubmitBtn />
            </form>
          ) : (
            <Pending />
          )
        )}
      </div>
    </div>
  )
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SubmitBtn() {
  return (
    <button
      type="submit"
      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
        py-2.5 rounded-md transition-colors"
    >
      Save Results
    </button>
  )
}

function Pending() {
  return (
    <p className="text-sm text-slate-500 italic py-4 text-center">
      Results not yet entered. Awaiting lab report.
    </p>
  )
}

// ── Haematology form ─────────────────────────────────────────────────────────

function HaematologyForm({ h }: { h: Record<string, unknown> | null }) {
  const n = (k: string) => h?.[k] as number | null | undefined
  const t = (k: string) => h?.[k] as string | null | undefined

  return (
    <>
      {/* Plasma */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Plasma</h3>
        <div className="grid grid-cols-3 gap-3">
          <TextInput name="plasma_colour"      label="Plasma Colour"       defaultValue={t('plasma_colour')} />
          <NumInput  name="plasma_protein_gdl" label="Plasma Protein" unit="g/dl" defaultValue={n('plasma_protein_gdl')} />
          <NumInput  name="fibrinogen_gdl"     label="Fibrinogen"     unit="g/dl" defaultValue={n('fibrinogen_gdl')} />
        </div>
      </section>

      {/* Erythrocytes */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Erythrocytes</h3>
        <div className="grid grid-cols-4 gap-3">
          <NumInput name="hb_gdl"          label="Hb"          unit="g/dl"    defaultValue={n('hb_gdl')} />
          <NumInput name="pcv_pct"         label="PCV"         unit="%"       defaultValue={n('pcv_pct')} />
          <NumInput name="rbc_x10_6_ul"    label="RBC"         unit="×10⁶/μl" defaultValue={n('rbc_x10_6_ul')} />
          <NumInput name="mcv_fl"          label="MCV"         unit="fl"      defaultValue={n('mcv_fl')} />
          <NumInput name="mchc_gdl"        label="MCHC"        unit="g/dl"    defaultValue={n('mchc_gdl')} />
          <TextInput name="reticulocytosis" label="Reticulocytosis"           defaultValue={t('reticulocytosis')} />
          <TextInput name="platelets"       label="Platelets"                 defaultValue={t('platelets')} />
        </div>
      </section>

      {/* Blood smear */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Blood Smear Examination</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            ['anisocytosis',           'Anisocytosis'],
            ['poikilocytosis',         'Poikilocytosis'],
            ['microcytosis',           'Microcytosis'],
            ['macrocytosis',           'Macrocytosis'],
            ['spherocytosis',          'Spherocytosis'],
            ['leptocytosis',           'Leptocytosis'],
            ['polychromatophilia',     'Polychromatophilia'],
            ['howell_jolly_bodies',    'Howell-Jolly Bodies'],
            ['rouleaux_formation',     'Rouleaux Formation'],
            ['red_cell_agglutination', 'Red Cell Agglutination'],
          ].map(([name, label]) => (
            <TextInput key={name} name={name} label={label} defaultValue={t(name)} />
          ))}
        </div>
      </section>

      {/* Leucocytes */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Leucocytes</h3>
        <div className="grid grid-cols-3 gap-3">
          <NumInput name="total_wbc_x10_3_ul" label="Total WBC" unit="×10³/μl" defaultValue={n('total_wbc_x10_3_ul')} />
        </div>
      </section>

      {/* Differential */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Differential Count
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-md overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 w-48">Cell Type</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">% (Relative)</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Absolute ×10³/μl</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['seg_neutrophils',  'Seg. Neutrophils'],
                ['band_neutrophils', 'Band Neutrophils'],
                ['lymphocytes',      'Lymphocytes'],
                ['monocytes',        'Monocytes'],
                ['eosinophils',      'Eosinophils'],
                ['basophils',        'Basophils'],
              ].map(([key, label]) => (
                <tr key={key}>
                  <td className="px-3 py-2 text-xs text-slate-700 font-medium">{label}</td>
                  <td className="px-3 py-2">
                    <input type="number" step="any" name={`${key}_pct`}
                      defaultValue={n(`${key}_pct`) ?? ''}
                      className="w-20 border border-slate-200 rounded px-2 py-1 text-sm
                        focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="any" name={`${key}_abs`}
                      defaultValue={n(`${key}_abs`) ?? ''}
                      className="w-24 border border-slate-200 rounded px-2 py-1 text-sm
                        focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Parasites */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Parasites (Other Observations)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <TextInput name="parasites_wet_mount"   label="Wet Mount"    defaultValue={t('parasites_wet_mount')} />
          <TextInput name="parasites_buffy_coat"  label="Buffy Coat"   defaultValue={t('parasites_buffy_coat')} />
          <TextInput name="parasites_blood_smear" label="Blood Smear"  defaultValue={t('parasites_blood_smear')} />
        </div>
      </section>

      {/* Interpretation */}
      <section>
        <Textarea name="interpretation" label="Interpretation" defaultValue={t('interpretation')} rows={5} />
      </section>
    </>
  )
}

function HaematologyReadOnly({ h }: { h: Record<string, unknown> }) {
  const n = (k: string) => h[k] as number | null
  const t = (k: string) => h[k] as string | null

  return (
    <div className="space-y-5">
      {/* Plasma */}
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Plasma</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Colour"         value={t('plasma_colour')} />
          <Field label="Protein (g/dl)" value={n('plasma_protein_gdl')} />
          <Field label="Fibrinogen (g/dl)" value={n('fibrinogen_gdl')} />
        </div>
      </section>

      {/* Erythrocytes */}
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Erythrocytes</p>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Hb (g/dl)"         value={n('hb_gdl')} />
          <Field label="PCV (%)"            value={n('pcv_pct')} />
          <Field label="RBC (×10⁶/μl)"     value={n('rbc_x10_6_ul')} />
          <Field label="MCV (fl)"           value={n('mcv_fl')} />
          <Field label="MCHC (g/dl)"        value={n('mchc_gdl')} />
          <Field label="Reticulocytosis"    value={t('reticulocytosis')} />
          <Field label="Platelets"          value={t('platelets')} />
        </div>
      </section>

      {/* Blood smear */}
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Blood Smear</p>
        <div className="grid grid-cols-5 gap-2">
          {[
            ['anisocytosis','Anisocytosis'], ['poikilocytosis','Poikilocytosis'],
            ['microcytosis','Microcytosis'], ['macrocytosis','Macrocytosis'],
            ['spherocytosis','Spherocytosis'], ['leptocytosis','Leptocytosis'],
            ['polychromatophilia','Polychromatophilia'], ['howell_jolly_bodies','Howell-Jolly'],
            ['rouleaux_formation','Rouleaux'], ['red_cell_agglutination','Agglutination'],
          ].map(([k, l]) => <Field key={k} label={l} value={t(k)} />)}
        </div>
      </section>

      {/* WBC + Differential */}
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Leucocytes</p>
        <Field label="Total WBC (×10³/μl)" value={n('total_wbc_x10_3_ul')} />
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm border border-slate-200 rounded overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 w-40">Cell Type</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">%</th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-slate-600">Abs ×10³/μl</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[['seg_neutrophils','Seg. Neutrophils'],['band_neutrophils','Band Neutrophils'],
                ['lymphocytes','Lymphocytes'],['monocytes','Monocytes'],
                ['eosinophils','Eosinophils'],['basophils','Basophils'],
              ].map(([k, l]) => (
                <tr key={k}>
                  <td className="px-3 py-1.5 text-xs text-slate-700">{l}</td>
                  <td className="px-3 py-1.5 text-right text-xs">{n(`${k}_pct`) ?? '—'}</td>
                  <td className="px-3 py-1.5 text-right text-xs">{n(`${k}_abs`) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Parasites */}
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Parasites</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Wet Mount"   value={t('parasites_wet_mount')} />
          <Field label="Buffy Coat"  value={t('parasites_buffy_coat')} />
          <Field label="Blood Smear" value={t('parasites_blood_smear')} />
        </div>
      </section>

      <Field label="Interpretation" value={t('interpretation')} />
      <p className="text-xs text-slate-400">
        Reported {h.reported_at ? new Date(String(h.reported_at)).toLocaleString('en-NG') : '—'}
      </p>
    </div>
  )
}

// ── Parasitology form ─────────────────────────────────────────────────────────

const SAMPLE_TYPES = [
  { value: 'whole_blood',        label: 'Whole Blood' },
  { value: 'faeces',             label: 'Faeces' },
  { value: 'skin_scraping',      label: 'Skin Scraping' },
  { value: 'sputum',             label: 'Sputum' },
  { value: 'csf',                label: 'CSF' },
  { value: 'brain',              label: 'Brain' },
  { value: 'intestinal_segment', label: 'Intestinal Segment' },
  { value: 'endo_ectoparasite',  label: 'Endo/Ectoparasite' },
  { value: 'other',              label: 'Other' },
]

const TESTS = [
  { value: 'simple_flotation',          label: 'Simple Flotation' },
  { value: 'sedimentation',             label: 'Sedimentation' },
  { value: 'mcmaster',                  label: 'McMaster Test' },
  { value: 'baermann',                  label: "Baermann's Technique" },
  { value: 'tbs',                       label: 'TBS' },
  { value: 'hct_bct',                   label: 'HCT/BCT' },
  { value: 'intestinal_scraping',       label: 'Intestinal Scraping' },
  { value: 'cryptosporidium_giardia',   label: 'Cryptosporidium/Giardia Ag' },
  { value: 'parasite_identification',   label: 'Parasite Identification' },
  { value: 'other',                     label: 'Other' },
]

function ParasitologyForm({ p }: { p: Record<string, unknown> | null }) {
  const checked   = (key: string, val: string) => (p?.[key] as string[] | null)?.includes(val) ?? false
  const txt       = (k: string) => p?.[k] as string | null | undefined

  return (
    <>
      {/* Sample types */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Sample / Specimen Type
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_TYPES.map(st => (
            <label key={st.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="sample_types"
                value={st.value}
                defaultChecked={checked('sample_types', st.value)}
                className="accent-teal-600"
              />
              {st.label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <TextInput name="endo_ectoparasite_retrieval_site" label="Retrieval site (if Endo/Ectoparasite)"
            defaultValue={txt('endo_ectoparasite_retrieval_site')} />
          <TextInput name="sample_type_other" label="Other (specify)"
            defaultValue={txt('sample_type_other')} />
        </div>
      </section>

      {/* Tests */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Test Requested
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {TESTS.map(t => (
            <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="tests_requested"
                value={t.value}
                defaultChecked={checked('tests_requested', t.value)}
                className="accent-teal-600"
              />
              {t.label}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <TextInput name="test_other" label="Other (specify)"
            defaultValue={txt('test_other')} />
        </div>
      </section>

      {/* Anti-parasite treatment */}
      <Textarea
        name="anti_parasite_treatment"
        label="Anti-parasite Treatment (including date of last dose)"
        defaultValue={txt('anti_parasite_treatment')}
        rows={2}
      />

      {/* Results */}
      <Textarea
        name="laboratory_result"
        label="Laboratory Result"
        defaultValue={txt('laboratory_result')}
        rows={6}
      />
    </>
  )
}

function ParasitologyReadOnly({ p }: { p: Record<string, unknown> }) {
  const txt = (k: string) => p[k] as string | null
  const arr = (k: string) => p[k] as string[] | null

  const sampleLabels = SAMPLE_TYPES
    .filter(s => arr('sample_types')?.includes(s.value))
    .map(s => s.label)
  const testLabels = TESTS
    .filter(t => arr('tests_requested')?.includes(t.value))
    .map(t => t.label)

  return (
    <div className="space-y-4">
      {sampleLabels.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Sample Types</p>
          <p className="text-sm text-slate-800">{sampleLabels.join(', ')}</p>
        </div>
      )}
      <Field label="Retrieval Site"  value={txt('endo_ectoparasite_retrieval_site')} />
      <Field label="Sample (Other)"  value={txt('sample_type_other')} />

      {testLabels.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Tests Requested</p>
          <p className="text-sm text-slate-800">{testLabels.join(', ')}</p>
        </div>
      )}
      <Field label="Test (Other)"    value={txt('test_other')} />

      <Field label="Anti-parasite Treatment" value={txt('anti_parasite_treatment')} />
      <Field label="Laboratory Result"       value={txt('laboratory_result')} />

      <p className="text-xs text-slate-400">
        Reported {p.reported_at ? new Date(String(p.reported_at)).toLocaleString('en-NG') : '—'}
      </p>
    </div>
  )
}

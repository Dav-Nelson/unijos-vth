import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { submitLabRequest } from './actions'

const REQUEST_TYPES = [
  {
    value: 'CYTOLOGY',
    label: 'Cytology',
    lab: 'Pathology Lab',
    desc: 'Cell morphology examination of aspirates, swabs, or fluids',
  },
  {
    value: 'HAEMATOLOGY',
    label: 'Haematology (CBC)',
    lab: 'Pathology Lab',
    desc: 'Full blood count — erythrocytes, leucocytes, differential, blood smear',
  },
  {
    value: 'BACTERIOLOGY_MYCOLOGY',
    label: 'Bacteriology & Mycology',
    lab: 'Microbiology Lab',
    desc: 'Culture, sensitivity, microscopy for bacteria and fungi',
  },
  {
    value: 'PARASITOLOGY_ENTOMOLOGY',
    label: 'Parasitology & Entomology',
    lab: 'Parasitology Lab',
    desc: 'Flotation, sedimentation, blood film, parasite identification',
  },
]

export default async function NewLabRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ case_id?: string; error?: string }>
}) {
  const { case_id, error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load case info if case_id provided
  let caseData: { id: string; case_number: string; owners: { full_name: string } | null } | null = null
  if (case_id) {
    const { data } = await supabase
      .from('cases')
      .select('id, case_number, owners(full_name)')
      .eq('id', case_id)
      .single()
    caseData = data as typeof caseData
  }

  // If no valid case_id, show a case number search form
  if (!caseData) {
    return (
      <div className="max-w-xl">
        <Link href="/labs" className="text-xs text-slate-400 hover:text-slate-600 mb-4 inline-block">
          ← Lab Requests
        </Link>
        <h1 className="text-lg font-bold text-slate-900 mb-5">New Lab Request</h1>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm text-amber-800 font-medium">Select a case first</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Lab requests are linked to a clinical case.
            Open the case from the Cases list and click &quot;+ Lab Request&quot;,
            or enter the case number below.
          </p>
        </div>

        <CaseSearchForm />
      </div>
    )
  }

  const owner = caseData.owners as { full_name: string } | null

  return (
    <div className="max-w-2xl">
      <Link href="/labs" className="text-xs text-slate-400 hover:text-slate-600 mb-4 inline-block">
        ← Lab Requests
      </Link>
      <h1 className="text-lg font-bold text-slate-900 mb-1">New Lab Request</h1>
      <p className="text-xs text-slate-500 mb-5">
        Case <span className="font-mono font-medium text-teal-700">{caseData.case_number}</span>
        {owner && <> · {owner.full_name}</>}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2 mb-4">
          <p className="text-xs text-red-700">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={submitLabRequest} className="space-y-5">
        <input type="hidden" name="case_id" value={caseData.id} />

        {/* Request type */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Test Type</h2>
          <div className="space-y-2">
            {REQUEST_TYPES.map(rt => (
              <label
                key={rt.value}
                className="flex items-start gap-3 p-3 rounded-md border border-slate-100
                  hover:border-teal-200 hover:bg-teal-50/30 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="request_type"
                  value={rt.value}
                  required
                  className="mt-0.5 accent-teal-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{rt.label}</p>
                  <p className="text-xs text-slate-500">{rt.lab} · {rt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Request details */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">Request Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specimen / Sample
              </label>
              <input
                type="text"
                name="specimen"
                placeholder="e.g. Blood (EDTA), Swab, Faeces"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none
                  focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date &amp; Time of Collection
              </label>
              <input
                type="datetime-local"
                name="date_of_collection"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Previous Lab No. <span className="text-slate-400 font-normal">(if repeat test)</span>
            </label>
            <input
              type="text"
              name="previous_lab_number"
              placeholder="LAB-2026-00000"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                text-slate-800 placeholder-slate-400 focus:outline-none
                focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              History &amp; Clinical Signs
            </label>
            <textarea
              name="history_clinical_signs"
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                text-slate-800 placeholder-slate-400 focus:outline-none
                focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tentative Diagnosis
            </label>
            <textarea
              name="tentative_diagnosis"
              rows={2}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                text-slate-800 placeholder-slate-400 focus:outline-none
                focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>

          {/* Investigation required — shown for bacteriology (js-hidden for others but
              still submitted; the server action ignores it for non-bacteriology types) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Investigation Required{' '}
              <span className="text-slate-400 font-normal">(Bacteriology/Mycology only)</span>
            </label>
            <textarea
              name="investigation_required"
              rows={2}
              placeholder="e.g. Culture &amp; sensitivity, Gram stain, KOH preparation…"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                text-slate-800 placeholder-slate-400 focus:outline-none
                focus:ring-2 focus:ring-teal-500 resize-y"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
            py-2.5 rounded-md transition-colors"
        >
          Submit Request
        </button>
      </form>
    </div>
  )
}

// ── Case search (shown when no case_id in URL) ────────────────────────────────

function CaseSearchForm() {
  return (
    <form method="get" action="/cases" className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-700 mb-2">Search for a case</p>
      <div className="flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="Owner name…"
          className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold
            px-4 py-2 rounded-md transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  )
}

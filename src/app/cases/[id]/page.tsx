import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile) redirect('/login')
  const role = userProfile.role

  // Fetch case with owner
  const { data: c } = await supabase
    .from('cases')
    .select('*, owners(full_name, phone, address)')
    .eq('id', id)
    .single()

  if (!c) notFound()

  // Fetch patient record
  let patient: Record<string, unknown> | null = null
  if (c.patient_type === 'INDIVIDUAL') {
    const { data } = await supabase
      .from('individual_patients')
      .select('*')
      .eq('case_id', id)
      .single()
    patient = data
  } else if (c.patient_type === 'FLOCK') {
    const { data } = await supabase
      .from('flock_patients')
      .select('*')
      .eq('case_id', id)
      .single()
    patient = data
  } else if (c.patient_type === 'POUND') {
    const { data } = await supabase
      .from('pound_patients')
      .select('*')
      .eq('case_id', id)
      .single()
    patient = data
  }

  // Fetch ambulatory trip if applicable
  let trip: Record<string, unknown> | null = null
  if (c.case_type === 'AMBULATORY') {
    const { data } = await supabase
      .from('ambulatory_trips')
      .select('*')
      .eq('case_id', id)
      .single()
    trip = data
  }

  // Fetch clinical record (Phase C)
  const { data: clinicalRecord } = await supabase
    .from('clinical_records')
    .select('id, status, updated_at')
    .eq('case_id', id)
    .maybeSingle()

  // Fetch lab requests for this case
  const { data: labRequestsData } = await supabase
    .from('lab_requests')
    .select('id, lab_number, request_type, status, requested_at')
    .eq('case_id', id)
    .order('requested_at', { ascending: false })

  const labRequests = labRequestsData ?? []

  const owner = c.owners as { full_name: string; phone: string; address: string | null } | null
  const createdAt = new Date(c.created_at).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const canWriteClinical = ['STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR'].includes(role)
  const canReview = ['RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR'].includes(role)
  const isReceptionist = role === 'RECEPTIONIST'
  const canRequestLab = ['STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER', 'CONSULTANT', 'PROFESSOR'].includes(role)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <div className="mb-4">
          {isReceptionist
            ? <Link href="/queue" className="text-xs text-slate-400 hover:text-slate-600">← Queue</Link>
            : <Link href="/cases" className="text-xs text-slate-400 hover:text-slate-600">← Cases</Link>
          }
        </div>

        {/* Case header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{c.case_number}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${c.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {c.status}
              </span>
              {c.case_type === 'AMBULATORY' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  bg-purple-100 text-purple-700">
                  Ambulatory
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Opened {createdAt}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/cases/${id}/print`}
              className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5
                rounded-md hover:bg-slate-50 transition-colors"
            >
              Print Card
            </Link>
            {canRequestLab && (
              <Link
                href={`/labs/new?case_id=${id}`}
                className="text-xs border border-blue-200 text-blue-600 px-3 py-1.5
                  rounded-md hover:bg-blue-50 transition-colors font-medium"
              >
                + Lab Request
              </Link>
            )}
            {(canWriteClinical || canReview) && !clinicalRecord && (
              <Link
                href={`/cases/${id}/clinical`}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold
                  px-3 py-1.5 rounded-md transition-colors"
              >
                + Clinical Record
              </Link>
            )}
            {clinicalRecord && (
              <Link
                href={`/cases/${id}/clinical`}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold
                  px-3 py-1.5 rounded-md transition-colors"
              >
                {canReview && clinicalRecord.status === 'PENDING_REVIEW'
                  ? 'Review Record'
                  : 'Clinical Record'}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Owner card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Owner</p>
            <p className="text-sm font-medium text-slate-800">{owner?.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{owner?.phone}</p>
            {owner?.address && <p className="text-xs text-slate-400 mt-0.5">{owner.address}</p>}
          </div>

          {/* Patient card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Patient · {c.patient_type}
            </p>
            {patient ? (
              <PatientSummary type={c.patient_type} patient={patient} />
            ) : (
              <p className="text-xs text-slate-400 italic">No patient details recorded yet.</p>
            )}
          </div>

          {/* Ambulatory trip card */}
          {trip && (
            <div className="col-span-2 bg-white rounded-lg border border-purple-200 p-4">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-widest mb-2">
                Ambulatory Trip
              </p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Farm location</p>
                  <p className="font-medium text-slate-800">{String(trip.farm_location)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Travel fee</p>
                  <p className="font-medium text-slate-800">
                    ₦{Number(trip.travel_fee).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="font-medium text-slate-800">
                    {trip.return_datetime ? 'Returned' : trip.departure_datetime ? 'On trip' : 'Pending departure'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clinical record status card */}
          {clinicalRecord && (
            <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Clinical Record
              </p>
              <div className="flex items-center gap-3">
                <ClinicalStatusBadge status={clinicalRecord.status} />
                <p className="text-xs text-slate-500">
                  Last updated {new Date(clinicalRecord.updated_at).toLocaleString('en-NG')}
                </p>
                <Link
                  href={`/cases/${id}/clinical`}
                  className="ml-auto text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Open →
                </Link>
              </div>
            </div>
          )}

          {/* Lab requests card */}
          {(labRequests.length > 0 || canRequestLab) && (
            <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Lab Requests
                </p>
                {canRequestLab && (
                  <Link
                    href={`/labs/new?case_id=${id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + New Request
                  </Link>
                )}
              </div>
              {labRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No lab requests for this case.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {labRequests.map(lr => (
                    <div key={lr.id} className="flex items-center gap-3 py-2">
                      <span className="text-xs font-mono text-teal-700">{lr.lab_number}</span>
                      <span className="text-xs text-slate-600">
                        {lr.request_type.replace('_', ' & ').replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                        ${lr.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : lr.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'}`}>
                        {lr.status}
                      </span>
                      <Link
                        href={`/labs/${lr.id}`}
                        className="ml-auto text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Open →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function PatientSummary({ type, patient }: { type: string; patient: Record<string, unknown> }) {
  const p = patient as Record<string, string | number | null | undefined>
  if (type === 'INDIVIDUAL') {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-800">{String(p.species ?? '')}</p>
        {p.breed != null && <p className="text-xs text-slate-500">{String(p.breed)}</p>}
        <div className="flex gap-3 text-xs text-slate-500 mt-1">
          {p.age_months != null && <span>{String(p.age_months)} months</span>}
          {p.weight_kg != null && <span>{String(p.weight_kg)} kg</span>}
          {p.sex != null && p.sex !== 'UNKNOWN' && <span>{String(p.sex)}</span>}
        </div>
      </div>
    )
  }
  if (type === 'FLOCK') {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-800">{String(p.species ?? '')}</p>
        <p className="text-xs text-slate-500">
          {String(p.flock_size)} birds · {String(p.sick_count)} sick
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-800">{String(p.species ?? '')}</p>
      {p.pond_size_m2 != null && (
        <p className="text-xs text-slate-500">{String(p.pond_size_m2)} m²</p>
      )}
    </div>
  )
}

function ClinicalStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT:          'bg-slate-100 text-slate-600',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
    REJECTED:       'bg-red-100 text-red-700',
    LOCKED:         'bg-green-100 text-green-700',
  }
  const labels: Record<string, string> = {
    DRAFT: 'Draft', PENDING_REVIEW: 'Pending Review',
    REJECTED: 'Rejected', LOCKED: 'Approved & Locked',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
      ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GrandRoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params
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

  // Receptionists and Pharmacists cannot access clinical pages
  if (['RECEPTIONIST', 'PHARMACIST'].includes(role)) redirect('/login')

  const { data: c } = await supabase
    .from('cases')
    .select('*, clinics(name)')
    .eq('id', caseId)
    .single()
  if (!c) notFound()

  const { data: rec } = await supabase
    .from('clinical_records')
    .select('*')
    .eq('case_id', caseId)
    .eq('status', 'LOCKED')
    .maybeSingle()

  if (!rec) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400 text-sm">
          This case does not have an approved clinical record.
        </p>
      </div>
    )
  }

  const clinic = c.clinics as { name: string } | null

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
            Grand Rounds · {clinic?.name}
          </p>
          <h1 className="text-2xl font-bold font-mono">{c.case_number}</h1>
        </div>

        {/* Clinical fields */}
        <div className="space-y-6">
          <GrandRoundsSection title="Chief Complaint"       content={rec.chief_complaint} />
          <GrandRoundsSection title="History"               content={rec.history} />
          <GrandRoundsSection title="Examination Findings"  content={rec.examination_findings} />
          <GrandRoundsSection title="Diagnosis"             content={rec.diagnosis} highlight />
          <GrandRoundsSection title="Treatment Plan"        content={rec.treatment_plan} />
          <GrandRoundsSection title="Prescriptions"         content={rec.prescriptions} />
        </div>

      </div>
    </div>
  )
}

function GrandRoundsSection({
  title, content, highlight = false,
}: {
  title: string; content?: string | null; highlight?: boolean
}) {
  if (!content) return null
  return (
    <div className={`rounded-lg p-5 ${highlight ? 'bg-teal-900/40 border border-teal-700' : 'bg-slate-800'}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2
        ${highlight ? 'text-teal-400' : 'text-slate-400'}`}>
        {title}
      </p>
      <p className="text-base text-white leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}

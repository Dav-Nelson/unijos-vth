import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PrintCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: c } = await supabase
    .from('cases')
    .select('*, owners(full_name, phone, address)')
    .eq('id', id)
    .single()

  if (!c) notFound()

  let patient: Record<string, unknown> | null = null
  if (c.patient_type === 'INDIVIDUAL') {
    const { data } = await supabase.from('individual_patients').select('*').eq('case_id', id).single()
    patient = data
  }

  const owner = c.owners as { full_name: string; phone: string; address: string | null } | null

  return (
    <>
      {/* Print styles — hides the button when printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print p-4 bg-slate-100 flex justify-between items-center">
        <a href={`/cases/${id}`} className="text-sm text-slate-600 hover:text-slate-800">← Back</a>
        <button
          onClick={() => window.print()}
          className="bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded"
        >
          Print
        </button>
      </div>

      {/* Card — A5 portrait, B&W optimised */}
      <div className="max-w-lg mx-auto p-8 bg-white min-h-screen font-sans text-sm">

        {/* Header */}
        <div className="text-center border-b-2 border-black pb-3 mb-4">
          <p className="font-bold text-base uppercase tracking-wide">
            University of Jos Veterinary Teaching Hospital
          </p>
          <p className="text-xs mt-0.5">Patient Registration Card</p>
        </div>

        {/* Case number */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-500">Case Number</p>
            <p className="text-xl font-bold font-mono">{c.case_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-medium">
              {new Date(c.created_at).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Owner */}
        <section className="border border-black rounded p-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-widest mb-2">Owner Information</p>
          <table className="w-full text-sm">
            <tbody>
              <tr><td className="text-gray-500 w-24 py-0.5">Name</td><td className="font-medium">{owner?.full_name}</td></tr>
              <tr><td className="text-gray-500 py-0.5">Phone</td><td>{owner?.phone}</td></tr>
              {owner?.address && <tr><td className="text-gray-500 py-0.5">Address</td><td>{owner.address}</td></tr>}
            </tbody>
          </table>
        </section>

        {/* Patient */}
        {patient && (() => {
          const p = patient as Record<string, string | number | null | undefined>
          return (
            <section className="border border-black rounded p-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-2">Patient Information</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-gray-500 w-24 py-0.5">Species</td><td className="font-medium">{String(p.species)}</td></tr>
                  {p.breed != null && <tr><td className="text-gray-500 py-0.5">Breed</td><td>{String(p.breed)}</td></tr>}
                  {p.age_months != null && <tr><td className="text-gray-500 py-0.5">Age</td><td>{String(p.age_months)} months</td></tr>}
                  {p.weight_kg != null && <tr><td className="text-gray-500 py-0.5">Weight</td><td>{String(p.weight_kg)} kg</td></tr>}
                  {p.sex != null && <tr><td className="text-gray-500 py-0.5">Sex</td><td>{p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : 'Unknown'}</td></tr>}
                </tbody>
              </table>
            </section>
          )
        })()}

        {/* Type badges */}
        <div className="flex gap-2 mb-4">
          <span className="border border-black px-2 py-0.5 text-xs font-medium">
            {c.case_type === 'AMBULATORY' ? 'AMBULATORY' : 'IN-CLINIC'}
          </span>
          <span className="border border-black px-2 py-0.5 text-xs font-medium">
            {c.patient_type}
          </span>
        </div>

        {/* Signature lines */}
        <div className="flex gap-8 mt-8">
          <div className="flex-1">
            <div className="border-b border-black h-8 mb-1" />
            <p className="text-xs text-gray-500">Receptionist</p>
          </div>
          <div className="flex-1">
            <div className="border-b border-black h-8 mb-1" />
            <p className="text-xs text-gray-500">Attending Vet</p>
          </div>
        </div>

      </div>
    </>
  )
}

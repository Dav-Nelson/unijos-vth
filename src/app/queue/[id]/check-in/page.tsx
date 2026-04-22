import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { checkIn } from './actions'

const SAC_SPECIES = ['Dog', 'Cat', 'Rabbit', 'Guinea Pig', 'Hamster', 'Parrot', 'Other']
const LAC_SPECIES = ['Cattle', 'Horse', 'Sheep', 'Goat', 'Pig', 'Donkey', 'Camel', 'Other']

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: appt } = await supabase
    .from('appointments')
    .select('*, owners(full_name, phone)')
    .eq('id', id)
    .single()

  if (!appt) notFound()
  if (appt.status === 'CHECKED_IN') redirect(`/cases/${appt.case_id}`)

  // Determine species list by clinic type
  const { data: clinic } = await supabase
    .from('clinics')
    .select('name, clinic_type')
    .eq('id', appt.clinic_id)
    .single()

  const speciesList = clinic?.clinic_type === 'SMALL_LARGE'
    ? (appt.clinic_id /* SAC or LAC */ ? SAC_SPECIES : LAC_SPECIES)
    : SAC_SPECIES // fallback

  // If AAC clinic (AVIAN_AQUATIC) — Form B not built yet (TODO-002)
  const isAAC = clinic?.clinic_type === 'AVIAN_AQUATIC'

  const owner = appt.owners as { full_name: string; phone: string } | null
  const scheduledTime = new Date(appt.scheduled_at).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/queue" className="text-xs text-slate-400 hover:text-slate-600">
          ← Back to Queue
        </Link>
      </div>

      <h1 className="text-lg font-bold text-slate-900 mb-1">Check In Patient</h1>
      <p className="text-xs text-slate-500 mb-5">{scheduledTime} · {appt.chief_complaint}</p>

      {/* Owner summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Owner</p>
        <p className="text-sm font-medium text-slate-800">{owner?.full_name}</p>
        <p className="text-xs text-slate-500">{owner?.phone}</p>
      </div>

      {/* Error from action */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
          <p className="text-xs text-red-700">{decodeURIComponent(error)}</p>
        </div>
      )}

      {/* Form B not built yet */}
      {isAAC && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
          <p className="text-xs font-semibold text-amber-800">
            Avian & Aquatic form (Form B) not yet available.
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Obtain the physical registration form from the clinic first. (TODO-002)
          </p>
        </div>
      )}

      {/* Check-in form */}
      <form action={checkIn} className="space-y-4">
        <input type="hidden" name="appointment_id" value={id} />

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Patient Details</h2>

          {/* Case type */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Case type</label>
            <div className="flex gap-3">
              {(['IN_CLINIC', 'AMBULATORY'] as const).map(ct => (
                <label key={ct} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="case_type" value={ct} defaultChecked={ct === 'IN_CLINIC'}
                    className="accent-teal-600" />
                  <span className="text-sm text-slate-700">
                    {ct === 'IN_CLINIC' ? 'In-Clinic' : 'Ambulatory (Farm Visit)'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Species */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Species *
              </label>
              <select name="species" required
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select species…</option>
                {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Breed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Breed <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input type="text" name="breed" placeholder="e.g. German Shepherd"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2
                  focus:ring-teal-500" />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (months) <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input type="number" name="age_months" min="0" placeholder="e.g. 24"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2
                  focus:ring-teal-500" />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weight (kg) <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input type="number" name="weight_kg" min="0" step="0.1" placeholder="e.g. 12.5"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2
                  focus:ring-teal-500" />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sex</label>
              <select name="sex"
                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                  text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Unknown</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          {/* Ambulatory fields (shown via JS — hidden by default) */}
          {/* Note: We use a details/summary pattern here since this is a server-rendered form.
              For a fully dynamic experience, this section would be a client component. */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <details>
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                Ambulatory details (expand if farm visit)
              </summary>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Farm location</label>
                  <input type="text" name="farm_location" placeholder="e.g. Vom, Plateau State"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                      text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2
                      focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel fee (₦)</label>
                  <input type="number" name="travel_fee" min="0" step="100" placeholder="e.g. 15000"
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                      text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2
                      focus:ring-teal-500" />
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
              px-6 py-2.5 rounded-md transition-colors"
          >
            Check In & Register Patient
          </button>
          <Link href="/queue" className="text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

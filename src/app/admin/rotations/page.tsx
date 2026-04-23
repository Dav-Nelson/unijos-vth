import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function RotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week } = await searchParams
  const admin = createAdminClient()

  // Get current week start (Monday)
  const ref = week ? new Date(week) : new Date()
  const day = ref.getDay()
  const monday = new Date(ref)
  monday.setDate(ref.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const weekLabel = monday.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
  const sundayLabel = sunday.toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
  const mondayISO = monday.toISOString().split('T')[0]
  const sundayISO = sunday.toISOString().split('T')[0]

  // Fetch rotations overlapping this week
  const { data: rotations } = await admin
    .from('rotations')
    .select('*, users!rotations_student_id_fkey(full_name)')
    .lte('start_date', sundayISO)
    .gte('end_date', mondayISO)
    .order('start_date')

  // Fetch clinics + labs for entity names
  const [{ data: clinics }, { data: labs }] = await Promise.all([
    admin.from('clinics').select('id, name'),
    admin.from('labs').select('id, name'),
  ])

  const entityName = (id: string, type: string) => {
    if (type === 'CLINIC') return clinics?.find(c => c.id === id)?.name ?? id
    return labs?.find(l => l.id === id)?.name ?? id
  }



  const prevWeek = new Date(monday); prevWeek.setDate(monday.getDate() - 7)
  const nextWeek = new Date(monday); nextWeek.setDate(monday.getDate() + 7)

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Rotation Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Week of {weekLabel} — {sundayLabel}
          </p>
        </div>
        <Link
          href="/admin/rotations/new"
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold
            px-4 py-2 rounded-md transition-colors"
        >
          + Add Rotation
        </Link>
      </div>

      {/* Week navigation */}
      <div className="flex gap-3 mb-5">
        <Link
          href={`/admin/rotations?week=${prevWeek.toISOString().split('T')[0]}`}
          className="text-xs border border-slate-200 px-3 py-1.5 rounded-md text-slate-600
            hover:bg-slate-50 transition-colors"
        >
          ← Previous Week
        </Link>
        <Link
          href={`/admin/rotations?week=${nextWeek.toISOString().split('T')[0]}`}
          className="text-xs border border-slate-200 px-3 py-1.5 rounded-md text-slate-600
            hover:bg-slate-50 transition-colors"
        >
          Next Week →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Student</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Start</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">End</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Semester</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(rotations ?? []).map(r => {
              const student = r.users as { full_name: string } | null
              const isActive = r.start_date <= mondayISO && r.end_date >= mondayISO
              return (
                <tr key={r.id} className={`hover:bg-slate-50/50 ${isActive ? 'bg-teal-50/30' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {student?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {entityName(r.entity_id, r.entity_type)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${r.entity_type === 'CLINIC'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-blue-100 text-blue-700'}`}>
                      {r.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.start_date}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{r.end_date}</td>
// ... (keep existing imports)
import { deleteRotation } from './actions'

// ... (in the mapping loop)
                  <td className="px-4 py-3 text-right">
                    <form action={async () => {
                      'use server'
                      await deleteRotation(r.id)
                    }}>
                      <button type="submit" className="text-xs text-red-600 hover:text-red-800">Delete</button>
                    </form>
                  </td>
// ...

            {(rotations ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No rotations for this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

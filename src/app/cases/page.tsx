import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')


  let query = supabase
    .from('cases')
    .select('*, owners(full_name, phone), clinics(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status && status !== 'ALL') query = query.eq('status', status as 'OPEN' | 'CLOSED')

  const { data: cases } = await query
  const all = cases ?? []

  // Filter by owner name search (client-side for simplicity — small dataset)
  const filtered = q
    ? all.filter(c => {
        const owner = c.owners as { full_name: string } | null
        return owner?.full_name?.toLowerCase().includes(q.toLowerCase())
      })
    : all

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between mb-5">
          <h1 className="text-lg font-bold text-slate-900">Cases</h1>
        </div>

        {/* Filters */}
        <form className="flex gap-3 mb-5">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by owner name…"
            className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
          />
          <select name="status" defaultValue={status ?? 'ALL'}
            className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button type="submit"
            className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold
              px-4 py-2 rounded-md transition-colors">
            Filter
          </button>
        </form>

        {/* Cases table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Case #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Clinic</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Opened</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => {
                const owner  = c.owners  as { full_name: string } | null
                const clinic = c.clinics as { name: string }     | null
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-teal-700">
                      {c.case_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{owner?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{clinic?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{c.patient_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs
                        font-medium ${c.status === 'OPEN'
                          ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cases/${c.id}`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                        Open →
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

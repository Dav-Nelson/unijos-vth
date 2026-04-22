import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const TYPE_LABELS: Record<string, string> = {
  CYTOLOGY:                'Cytology',
  HAEMATOLOGY:             'Haematology',
  BACTERIOLOGY_MYCOLOGY:   'Bacteriology & Mycology',
  PARASITOLOGY_ENTOMOLOGY: 'Parasitology & Entomology',
}

const TYPE_COLOURS: Record<string, string> = {
  CYTOLOGY:                'bg-purple-100 text-purple-700',
  HAEMATOLOGY:             'bg-red-100 text-red-700',
  BACTERIOLOGY_MYCOLOGY:   'bg-blue-100 text-blue-700',
  PARASITOLOGY_ENTOMOLOGY: 'bg-green-100 text-green-700',
}

const STATUS_COLOURS: Record<string, string> = {
  PENDING:     'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED:   'bg-green-100 text-green-700',
}

export default async function LabsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  const { status, type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('lab_requests')
    .select('*, cases(case_number, owners(full_name)), labs(name)')
    .order('requested_at', { ascending: false })
    .limit(100)

  if (status && status !== 'ALL') {
    query = query.eq('status', status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED')
  }
  if (type && type !== 'ALL') {
    query = query.eq('request_type', type as 'CYTOLOGY' | 'HAEMATOLOGY' | 'BACTERIOLOGY_MYCOLOGY' | 'PARASITOLOGY_ENTOMOLOGY')
  }

  const { data: requests } = await query
  const all = requests ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Lab Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">{all.length} request{all.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/labs/new"
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold
            px-4 py-2 rounded-md transition-colors shrink-0"
        >
          + New Request
        </Link>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-5 flex-wrap">
        <select
          name="status"
          defaultValue={status ?? 'ALL'}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
            bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          name="type"
          defaultValue={type ?? 'ALL'}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
            bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="ALL">All types</option>
          <option value="CYTOLOGY">Cytology</option>
          <option value="HAEMATOLOGY">Haematology</option>
          <option value="BACTERIOLOGY_MYCOLOGY">Bacteriology & Mycology</option>
          <option value="PARASITOLOGY_ENTOMOLOGY">Parasitology & Entomology</option>
        </select>
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold
            px-4 py-2 rounded-md transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Lab No.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Case #</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Test Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Lab</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {all.map(req => {
              const c     = req.cases  as { case_number: string; owners: { full_name: string } | null } | null
              const lab   = req.labs   as { name: string } | null
              return (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-teal-700">
                    {req.lab_number}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">
                    {c?.case_number ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {(c?.owners as { full_name: string } | null)?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${TYPE_COLOURS[req.request_type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TYPE_LABELS[req.request_type] ?? req.request_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{lab?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${STATUS_COLOURS[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(req.requested_at).toLocaleDateString('en-NG')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/labs/${req.id}`}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {all.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                  No lab requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

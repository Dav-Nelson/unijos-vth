import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormularyShell from './_components/formulary-shell'
import AddDrugForm from './_components/add-drug-form'

export default async function FormularyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; show?: string }>
}) {
  const { q, show } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string
  if (!['PHARMACIST', 'STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
        'CONSULTANT', 'PROFESSOR', 'ADMIN'].includes(role)) {
    redirect('/login')
  }

  const isPharmacist = role === 'PHARMACIST' || role === 'ADMIN'

  // Fetch drugs — include deprecated only if explicitly requested
  let query = supabase
    .from('drugs')
    .select('*')
    .order('name')

  if (show !== 'all') query = query.eq('is_deprecated', false)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: drugs } = await query
  const allDrugs = drugs ?? []

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <FormularyShell userName={profile?.full_name ?? ''} role={role}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Drug Formulary</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {allDrugs.length} {show === 'all' ? '' : 'active '}drug{allDrugs.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Add drug form — pharmacist only */}
        {isPharmacist && <AddDrugForm userId={user.id} />}

        {/* Search + filter bar */}
        <form className="flex gap-3 mb-5">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by drug name…"
            className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
          />
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              name="show"
              value="all"
              defaultChecked={show === 'all'}
            />
            Show deprecated
          </label>
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold
              px-4 py-2 rounded-md transition-colors"
          >
            Filter
          </button>
        </form>

        {/* Drugs table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Generic name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Form</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allDrugs.map(drug => (
                <tr key={drug.id} className={`hover:bg-slate-50/50 ${drug.is_deprecated ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{drug.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{drug.generic_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {drug.form}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{drug.unit}</td>
                  <td className="px-4 py-3">
                    {drug.is_deprecated ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                        font-medium bg-red-100 text-red-600">
                        Deprecated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                        font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {allDrugs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    {q ? `No drugs matching "${q}".` : 'No drugs in formulary yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FormularyShell>
  )
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { ApprovalQueue } from './_components/approval-queue'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  
  // Fetch pending records with author info
  const { data: pending } = await supabase
    .from('clinical_records')
    .select(`
      id,
      case_id,
      updated_at,
      author:users!author_id(full_name),
      cases:case_id(case_number)
    `)
    .eq('status', 'PENDING_REVIEW')
    .order('updated_at', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-6 text-slate-900">Approval Queue</h1>
        <ApprovalQueue pendingRecords={pending || []} />
      </div>
    </div>
  )
}
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Approval Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {records.length} record{records.length !== 1 ? 's' : ''} pending review
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 px-6 py-16 text-center">
            <p className="text-sm text-slate-500">No records pending review. All clear.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Case #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Owner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Clinic</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(rec => {
                  return (
                    <ApprovalItem key={rec.id} rec={rec} />
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

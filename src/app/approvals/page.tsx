import { createClient } from '@/lib/supabase/server'
import { ApprovalQueue } from './_components/approval-queue'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: records } = await supabase
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
        {records && records.length > 0 ? (
          <ApprovalQueue pendingRecords={records} />
        ) : (
          <p className="text-sm text-slate-500">No records pending review. All clear.</p>
        )}
      </div>
    </div>
  )
}

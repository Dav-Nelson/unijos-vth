import { ClinicalEditor } from './_components/clinical-editor'
import { createClient } from '@/lib/supabase/server'

export default async function ClinicalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('clinical_records')
    .select('*')
    .eq('case_id', id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-6 text-slate-900">Clinical Record: {id}</h1>
        <ClinicalEditor caseId={id} initialData={record} />
      </div>
    </div>
  )
}

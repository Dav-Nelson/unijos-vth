import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import QueueTable from './_components/queue-table'
import { Database } from '@/types/database.types'

export default async function QueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('clinic_id')
    .eq('id', user!.id)
    .single()

  if (!profile?.clinic_id) return <p className="text-sm text-red-600">No clinic assigned to your account.</p>

  const clinicId = profile.clinic_id

  // Today's window in ISO strings
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, owners(full_name, phone)')
    .eq('clinic_id', clinicId)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .order('scheduled_at', { ascending: true })

  const appts = appointments ?? []
  const total     = appts.length
  const checkedIn = appts.filter(a => a.status === 'CHECKED_IN').length
  const pending   = appts.filter(a => a.status === 'SCHEDULED').length
  const completed = appts.filter(a => a.status === 'COMPLETED').length

  const today = now.toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Today&apos;s Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link
          href="/queue/new"
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold
            px-4 py-2 rounded-md transition-colors shrink-0"
        >
          + New Appointment
        </Link>
      </div>
          
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',      value: total,     color: 'text-slate-800' },
          { label: 'Scheduled',  value: pending,   color: 'text-blue-700' },
          { label: 'Checked In', value: checkedIn, color: 'text-amber-700' },
          { label: 'Completed',  value: completed, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Queue table — client component handles check-in and no-show buttons */}
      <QueueTable appointments={appts as (Database['public']['Tables']['appointments']['Row'] & { owners: { full_name: string, phone: string } | null; })[]} />
    </div>
  )
}

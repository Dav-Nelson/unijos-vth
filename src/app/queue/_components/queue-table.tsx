'use client'

import Link from 'next/link'
import { markNoShow, cancelAppointment } from '../actions'

type Appointment = {
  id: string
  scheduled_at: string
  status: string
  chief_complaint: string
  case_id: string | null
  notes: string | null
  owners: { full_name: string; phone: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  SCHEDULED:  'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS:'bg-teal-100 text-teal-700',
  COMPLETED:  'bg-green-100 text-green-700',
  NO_SHOW:    'bg-slate-100 text-slate-500',
  CANCELLED:  'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:  'Scheduled',
  CHECKED_IN: 'Checked In',
  IN_PROGRESS:'In Progress',
  COMPLETED:  'Completed',
  NO_SHOW:    'No Show',
  CANCELLED:  'Cancelled',
}

export default function QueueTable({ appointments }: { appointments: Appointment[] }) {

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 px-6 py-16 text-center">
        <p className="text-sm text-slate-500">No appointments scheduled for today.</p>
        <Link
          href="/queue/new"
          className="mt-3 inline-block text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          Schedule the first one →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 w-20">Time</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Owner</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Chief Complaint</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 w-28">Status</th>
            <th className="px-4 py-3 w-40"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map(appt => {
            const time = new Date(appt.scheduled_at).toLocaleTimeString('en-NG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })

            return (
              <tr key={appt.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{time}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">
                    {appt.owners?.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400">{appt.owners?.phone ?? ''}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                  {appt.chief_complaint}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${STATUS_BADGE[appt.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[appt.status] ?? appt.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    {appt.status === 'SCHEDULED' && (
                      <>
                        <Link
                          href={`/queue/${appt.id}/check-in`}
                          className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold
                            px-3 py-1.5 rounded transition-colors"
                        >
                          Check In
                        </Link>
                        <form action={markNoShow.bind(null, appt.id)}>
                          <button
                            type="submit"
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            No Show
                          </button>
                        </form>
                      </>
                    )}
                    {(appt.status === 'CHECKED_IN' || appt.status === 'IN_PROGRESS') && appt.case_id && (
                      <Link
                        href={`/cases/${appt.case_id}`}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View Case →
                      </Link>
                    )}
                    {appt.status === 'SCHEDULED' && (
                      <form action={cancelAppointment.bind(null, appt.id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-600">
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

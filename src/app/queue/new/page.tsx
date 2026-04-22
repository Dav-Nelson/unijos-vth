import Link from 'next/link'
import AppointmentForm from './_components/appointment-form'

export default function NewAppointmentPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/queue" className="text-xs text-slate-400 hover:text-slate-600">
          ← Back to Queue
        </Link>
      </div>
      <h1 className="text-lg font-bold text-slate-900 mb-5">New Appointment</h1>
      <AppointmentForm />
    </div>
  )
}

import { PatientRegistrationForm } from './_components/patient-registration-form'

export default function NewPatientPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-xl font-bold mb-6 text-slate-900">New Patient Registration</h1>
        <PatientRegistrationForm />
      </div>
    </div>
  )
}

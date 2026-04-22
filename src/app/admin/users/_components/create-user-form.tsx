'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createUser, type CreateUserInput } from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────
type Clinic = { id: string; name: string; code: string }

const CLINIC_SCOPED_ROLES = [
  'RECEPTIONIST', 'STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
]

// ── Validation (mirrors server-side schema) ───────────────────────────────────
const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum([
    'ADMIN', 'RECEPTIONIST', 'STUDENT', 'INTERN', 'RESIDENT_VET',
    'LECTURER', 'CONSULTANT', 'PROFESSOR', 'PHARMACIST',
  ]),
  clinic_id: z.string().nullish(),
}).refine(data => {
  if (CLINIC_SCOPED_ROLES.includes(data.role)) {
    return !!data.clinic_id
  }
  return true
}, {
  message: 'Clinic scope is required for this role',
  path: ['clinic_id'],
})

type FormValues = z.infer<typeof schema>

// ── Component ─────────────────────────────────────────────────────────────────
export default function CreateUserForm({ clinics }: { clinics: Clinic[] }) {
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'RECEPTIONIST', clinic_id: null },
  })

  const selectedRole = control._watch('role')
  const needsClinic = CLINIC_SCOPED_ROLES.includes(selectedRole)

  function openForm() {
    setShowForm(true)
    setServerError(null)
  }

  function cancelForm() {
    setShowForm(false)
    setServerError(null)
    reset()
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    const input: CreateUserInput = {
      ...values,
      // If the role doesn't need a clinic, ignore whatever is in the field
      clinic_id: needsClinic ? (values.clinic_id ?? null) : null,
    }

    const result = await createUser(input)

    if (!result.success) {
      setServerError(result.error)
      return
    }

    setCreatedPassword(result.tempPassword)
    setShowForm(false)
    reset()
    router.refresh() // re-fetches the server component so the table updates
  }

  return (
    <div>

      {/* ── Header row: title + create button ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-slate-900">User Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All accounts are admin-provisioned. No self-registration.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openForm}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-md shrink-0"
          >
            + Create User
          </button>
        )}
      </div>

      {/* ── Success banner with temp password ── */}
      {createdPassword && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800">Account created</p>
            <p className="text-xs text-green-700 mt-0.5">
              Share this temporary password with the new user.
              They will be prompted to change it on first login.
            </p>
            <p className="text-sm font-mono font-bold text-green-900 mt-1 select-all tracking-wide">
              {createdPassword}
            </p>
          </div>
          <button
            onClick={() => setCreatedPassword(null)}
            className="text-green-600 hover:text-green-800 text-xl leading-none shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Create user form panel ── */}
      {showForm && (
        <div className="bg-white border border-teal-200 rounded-lg p-5 mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            New User Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-3 gap-4">

              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fatima Garba"
                  {...register('full_name')}
                  className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                    focus:border-transparent
                    ${errors.full_name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="name@unijos-vth.edu.ng"
                  {...register('email')}
                  className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                    focus:border-transparent
                    ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                    text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="STUDENT">Student</option>
                  <option value="INTERN">Intern</option>
                  <option value="RESIDENT_VET">Resident Vet</option>
                  <option value="LECTURER">Lecturer</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Clinic scope — only shown for clinic-scoped roles */}
              {needsClinic && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinic scope
                  </label>
                  <select
                    {...register('clinic_id')}
                    defaultValue=""
                    className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800 bg-white
                      focus:outline-none focus:ring-2 focus:ring-teal-500
                      ${errors.clinic_id ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                  >
                    <option value="">Select a clinic…</option>
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.clinic_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.clinic_id.message}</p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className={`flex items-end gap-2 ${needsClinic ? '' : 'col-start-3'}`}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white
                    text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-2
                    transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="border border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-md
                    hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

            </div>

            {serverError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <p className="text-xs text-red-700">{serverError}</p>
              </div>
            )}
          </form>
        </div>
      )}

    </div>
  )
}

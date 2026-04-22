'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

// ── Validation schema ──────────────────────────────────────────────────────
const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

// ── Page ───────────────────────────────────────────────────────────────────
export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showNew, setShowNew] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(values: ChangePasswordFormValues) {
    setServerError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setServerError('Session expired. Please sign in again.')
      router.push('/login')
      return
    }

    // Update to the new password — user is already authenticated, no re-auth needed
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.newPassword,
    })

    if (updateError) {
      setServerError(updateError.message)
      return
    }

    // Clear the must_change_password flag in our users table
    const { error: flagError } = await supabase
      .from('users')
      .update({ must_change_password: false })
      .eq('id', user.id)

    if (flagError) {
      // Password was changed — don't block them. They can proceed.
      console.error('Failed to clear must_change_password flag:', flagError)
    }

    // Refresh so the proxy re-reads the session and redirects to the role landing
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            University of Jos
          </p>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Veterinary Teaching Hospital
          </h1>
        </div>

        {/* Warning banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Password change required
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You must set a new password before you can access the system.
              You cannot access any other page until this is done.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">
            Set new password
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* New password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...register('newPassword')}
                  className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                    ${errors.newPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm new password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat new password"
                {...register('confirmPassword')}
                className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <p className="text-xs text-red-700">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                text-white text-sm font-semibold py-2.5 rounded-md
                flex items-center justify-center gap-2
                transition-colors duration-150"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating…
                </>
              ) : (
                'Set new password'
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

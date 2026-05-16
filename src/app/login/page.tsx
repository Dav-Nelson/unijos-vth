'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, LogIn } from 'lucide-react'

// ── Validation schema ──────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ── Page ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues, event?: React.BaseSyntheticEvent) {
    event?.preventDefault()
    setServerError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      // Don't leak whether the email exists — show a generic message
      setServerError('Incorrect email or password. Please try again.')
      return
    }

    // Successful login — refresh so the proxy reads the new session
    // and redirects to the correct landing page based on role
    window.location.href = '/'
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
          <p className="text-sm text-slate-500 mt-1">Clinic Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Sign in</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@unijos-vth.edu.ng"
                {...register('email')}
                className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full border rounded-md px-3 py-2 pr-10 text-sm text-slate-800 placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
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
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 transition-colors duration-150"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>

          </form>
        </div>

        {/* No self-registration note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          Accounts are created by the system administrator.
          <br />Contact admin if you need access.
        </p>

      </div>
    </div>
  )
}

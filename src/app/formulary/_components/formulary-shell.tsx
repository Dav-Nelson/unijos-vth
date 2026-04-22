'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FormularyShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode
  userName: string
  role: string
}) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const roleLabel = role === 'PHARMACIST' ? 'Pharmacist' : role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 h-13 flex items-center px-6 gap-4 shrink-0">
        <div>
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-widest">
            Unijos VTH
          </span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-sm font-medium text-slate-700">Drug Formulary</span>
        </div>
        <span className="flex-1" />
        <span className="text-xs text-slate-500">{userName} · {roleLabel}</span>
        <button
          onClick={signOut}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

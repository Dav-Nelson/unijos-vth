'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FlaskConical, List, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LabShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode
  userName: string
  role: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const roleLabel = role
    .toLowerCase()
    .split('_')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')


  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Unijos VTH
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            Lab Requests
          </p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <Link
            href="/labs"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
              ${pathname === '/labs'
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <List className="w-4 h-4 shrink-0" />
            All Requests
          </Link>

          <Link
            href="/labs/new"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
              ${pathname.startsWith('/labs/new')
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            New Request
          </Link>
        </nav>

        <div className="px-5 py-3 border-t border-slate-100 space-y-2">
          <Link
            href="/cases"
            className="block text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Back to Cases
          </Link>
          <div>
            <p className="text-sm font-medium text-slate-700">{userName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>

    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: "Today's Queue",    href: '/queue',      icon: ClipboardList },
  { label: 'New Appointment',  href: '/queue/new',  icon: Calendar },
]

export default function ReceptionistShell({
  children,
  userName,
  clinicName,
}: {
  children: React.ReactNode
  userName: string
  clinicName: string
}) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-widest">
            Unijos VTH
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {clinicName}
          </p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                  ${active
                    ? 'bg-teal-50 text-teal-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Receptionist
          </p>
          <p className="text-sm font-medium text-slate-700 mt-0.5">{userName}</p>
          <button
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0">
          <span className="text-sm font-semibold text-slate-700">
            {clinicName} · Reception
          </span>
          <span className="flex-1" />
          <span className="text-xs text-slate-500">{userName}</span>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

    </div>
  )
}

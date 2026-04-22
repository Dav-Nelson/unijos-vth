import { createAdminClient } from '@/lib/supabase/admin'
import CreateUserForm from './_components/create-user-form'

// ── Role badge colours ─────────────────────────────────────────────────────────
const ROLE_COLOURS: Record<string, string> = {
  ADMIN:        'bg-red-100 text-red-700',
  RECEPTIONIST: 'bg-slate-100 text-slate-700',
  STUDENT:      'bg-slate-100 text-slate-700',
  INTERN:       'bg-slate-100 text-slate-700',
  RESIDENT_VET: 'bg-teal-100 text-teal-700',
  LECTURER:     'bg-teal-100 text-teal-700',
  CONSULTANT:   'bg-blue-100 text-blue-700',
  PROFESSOR:    'bg-purple-100 text-purple-700',
  PHARMACIST:   'bg-blue-100 text-blue-700',
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      ${ROLE_COLOURS[role] ?? 'bg-slate-100 text-slate-700'}`}>
      {formatRole(role)}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function UsersPage() {
  const admin = createAdminClient()

  // Fetch app-level user rows and clinic names in parallel
  const [{ data: dbUsers }, { data: clinicsData }, authResult] = await Promise.all([
    admin.from('users').select('*').order('created_at', { ascending: true }),
    admin.from('clinics').select('id, name, code').order('name'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const clinics = clinicsData ?? []
  const authUsers = authResult.data?.users ?? []

  // Merge email from auth.users into each profile row
  const users = (dbUsers ?? []).map(u => ({
    ...u,
    email: authUsers.find(a => a.id === u.id)?.email ?? '—',
  }))

  return (
    <div>
      {/* Form panel handles its own header row (title + button + success banner) */}
      <CreateUserForm clinics={clinics} />

      {/* Users table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">
                Clinic scope
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                  {user.full_name}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {user.clinic_id
                    ? (clinics.find(c => c.id === user.clinic_id)?.name ?? '—')
                    : 'System-wide'
                  }
                </td>
                <td className="px-4 py-3">
                  {user.must_change_password ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                      font-medium bg-amber-100 text-amber-700">
                      Temp password
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                      font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function AddRotationPage() {
  const [supabase, admin] = [await createClient(), createAdminClient()]
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: students }, { data: clinics }, { data: labs }] = await Promise.all([
    admin.from('users').select('id, full_name, role').in('role', ['STUDENT', 'INTERN']).order('full_name'),
    admin.from('clinics').select('id, name'),
    admin.from('labs').select('id, name'),
  ])

  async function addRotation(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user: u } } = await s.auth.getUser()
    if (!u) redirect('/login')

    const a = createAdminClient()
    const entityId   = formData.get('entity_id') as string
    const entityType = formData.get('entity_type') as 'CLINIC' | 'LAB'

    await a.from('rotations').insert({
      student_id:  formData.get('student_id') as string,
      entity_id:   entityId,
      entity_type: entityType,
      start_date:  formData.get('start_date') as string,
      end_date:    formData.get('end_date') as string,
      semester:    formData.get('semester') as string,
      created_by:  u.id,
    })

    redirect('/admin/rotations')
  }

  return (
    <div className="max-w-lg">
      <div className="mb-4">
        <Link href="/admin/rotations" className="text-xs text-slate-400 hover:text-slate-600">
          ← Rotations
        </Link>
      </div>
      <h1 className="text-lg font-bold text-slate-900 mb-5">Add Rotation</h1>

      <form action={addRotation} className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Student / Intern</label>
          <select name="student_id" required
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select student…</option>
            {(students ?? []).map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Entity type</label>
          <select name="entity_type" required
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="CLINIC">Clinic</option>
            <option value="LAB">Lab</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic / Lab</label>
          <select name="entity_id" required
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
              bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
            <optgroup label="Clinics">
              {(clinics ?? []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Labs">
              {(labs ?? []).map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start date</label>
            <input type="date" name="start_date" required
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End date</label>
            <input type="date" name="end_date" required
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Semester <span className="font-normal text-slate-400">e.g. 2026-SEM1</span>
          </label>
          <input type="text" name="semester" required placeholder="2026-SEM1"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm
              placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <button type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold
            py-2.5 rounded-md transition-colors">
          Add Rotation
        </button>
      </form>
    </div>
  )
}

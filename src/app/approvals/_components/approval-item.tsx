'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Database } from '@/types/database.types'

type ClinicalRecord = Database['public']['Tables']['clinical_records']['Row'] & {
  cases: (Database['public']['Tables']['cases']['Row'] & {
    owners: Database['public']['Tables']['owners']['Row'] | null;
    clinics: Database['public']['Tables']['clinics']['Row'] | null;
  }) | null;
}

export function ApprovalItem({ rec }: { rec: ClinicalRecord }) {
  const c = rec.cases
  const owner = c?.owners
  const clinic = c?.clinics
  const waitLabel = useMemo(() => {
    const submitted = new Date(rec.updated_at)
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const waitMins = Math.round((now - submitted.getTime()) / 60000)
    return waitMins < 60
      ? `${waitMins}m ago`
      : `${Math.round(waitMins / 60)}h ago`
  }, [rec.updated_at])

  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-4 py-3 text-sm font-mono font-medium text-teal-700">
        {c?.case_number ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-800">{owner?.full_name ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{clinic?.name ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{waitLabel}</td>
      <td className="px-4 py-3">
        <Link
          href={`/cases/${rec.case_id}/clinical`}
          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold
            px-3 py-1.5 rounded transition-colors"
        >
          Review
        </Link>
      </td>
    </tr>
  )
}

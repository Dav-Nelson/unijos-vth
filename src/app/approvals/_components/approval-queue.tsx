'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ApprovalQueue({ pendingRecords }: { pendingRecords: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (pendingRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 px-6 py-16 text-center">
        <p className="text-sm text-slate-500">No records pending review. All clear.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Case #</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Student</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Submitted</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pendingRecords.map((rec) => (
            <tr key={rec.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-teal-700 font-medium">
                {rec.cases?.case_number}
              </td>
              <td className="px-4 py-3 text-slate-800">{rec.author?.full_name}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {new Date(rec.updated_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => router.push(`/cases/${rec.case_id}/clinical`)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                >
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

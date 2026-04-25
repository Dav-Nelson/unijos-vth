'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createInvoice } from '../actions'

export function InvoiceCreator({ caseId, type }: { caseId: string, type: 'STANDARD' | 'AMBULATORY' }) {
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const router = useRouter()

  async function handleCreate() {
    setLoading(true)
    const result = await createInvoice(caseId, type, total)
    setLoading(false)

    if (result.success) {
      toast.success('Invoice created!')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h2 className="text-lg font-bold mb-4">Create {type} Invoice</h2>
      {type === 'AMBULATORY' && (
        <input 
          type="number" 
          placeholder="Estimated Total" 
          onChange={(e) => setTotal(Number(e.target.value))}
          className="w-full border p-2 rounded mb-4"
        />
      )}
      <button 
        onClick={handleCreate} 
        disabled={loading}
        className="bg-teal-600 text-white px-4 py-2 rounded font-semibold"
      >
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
    </div>
  )
}

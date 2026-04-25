'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { recordPayment } from '../actions'

export function PaymentRecorder({ invoiceId, balance }: { invoiceId: string, balance: number }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(balance)
  const router = useRouter()

  async function handlePayment() {
    setLoading(true)
    const result = await recordPayment(invoiceId, amount, 'CASH', 'FULL')
    setLoading(false)

    if (result.success) {
      toast.success('Payment recorded!')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200 mt-6">
      <h2 className="text-lg font-bold mb-4">Record Payment</h2>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Amount</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full border p-2 rounded"
        />
      </div>
      <button 
        onClick={handlePayment} 
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Recording...' : 'Record Payment'}
      </button>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BillingDashboardPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, cases(case_number), payments(amount, payment_type)')
    .order('created_at', { ascending: false })

  const totalCollected = invoices?.reduce((acc, inv) => 
    acc + (inv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0), 0) || 0

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl font-bold mb-6 text-slate-900">Billing Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">Total Collected</h3>
                <p className="text-2xl font-bold mt-2">₦{totalCollected.toLocaleString()}</p>
            </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-800 p-6 border-b">All Invoices</h2>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3">Case ID</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Total Paid</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices?.map(inv => {
                const paid = inv.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0
                return (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono">{inv.cases?.case_number}</td>
                    <td className="px-4 py-3">{inv.invoice_type}</td>
                    <td className="px-4 py-3">{inv.status}</td>
                    <td className="px-4 py-3 text-right">₦{paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                        <Link href={`/billing/invoices/${inv.id}`} className="text-teal-600 font-semibold hover:underline">Details</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

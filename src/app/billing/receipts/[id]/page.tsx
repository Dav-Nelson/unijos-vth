import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment, error } = await supabase
    .from('payments')
    .select(`
      *,
      invoices(case_id, invoice_type, cases(case_number))
    `)
    .eq('id', id)
    .single()

  if (error || !payment) notFound()

  return (
    <div className="p-8 max-w-sm mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">University of Jos</h1>
        <h2 className="text-sm font-semibold">Veterinary Teaching Hospital</h2>
      </div>

      <div className="space-y-2 border-b pb-4 mb-4 text-sm">
        <p><strong>Receipt #:</strong> {payment.receipt_number}</p>
        <p><strong>Case #:</strong> {payment.invoices?.cases?.case_number}</p>
        <p><strong>Date:</strong> {new Date(payment.paid_at).toLocaleDateString()}</p>
        <p><strong>Type:</strong> {payment.payment_type} Payment</p>
      </div>

      <div className="flex justify-between font-bold text-lg border-b pb-4 mb-4">
        <span>Total Paid</span>
        <span>₦{Number(payment.amount).toLocaleString()}</span>
      </div>

      <div className="text-center text-xs text-slate-500 mt-8">
        <p>Thank you for your payment.</p>
        <p>Keep this receipt for your records.</p>
      </div>
    </div>
  )
}

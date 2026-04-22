'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const clinicalSchema = z.object({
  chief_complaint: z.string().min(5, 'Required'),
  history: z.string().optional(),
  examination_findings: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  prescriptions: z.string().optional(),
})

type ClinicalFormValues = z.infer<typeof clinicalSchema>

export function ClinicalEditor({ 
  caseId, 
  initialData 
}: { 
  caseId: string, 
  initialData: ClinicalFormValues | null 
}) {
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm<ClinicalFormValues>({
    resolver: zodResolver(clinicalSchema),
    defaultValues: initialData || {},
  })

  // Auto-save logic placeholder
  const values = watch()
  useEffect(() => {
    const timer = setTimeout(() => {
        // Here we would call an API route to auto-save to DRAFT
        console.log('Auto-saving:', values)
    }, 3000)
    return () => clearTimeout(timer)
  }, [values])

import { submitClinicalRecord } from '../actions'

// ... (schema remains)

  async function onSubmit(data: ClinicalFormValues) {
    const result = await submitClinicalRecord(caseId, data)
    if (!result.success) {
      alert(result.error)
      return
    }
    // Success path, e.g., show a toast or refresh
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Chief Complaint</label>
          <textarea {...register('chief_complaint')} className="w-full border rounded-md p-2 h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">History</label>
          <textarea {...register('history')} className="w-full border rounded-md p-2 h-24" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Examination Findings</label>
          <textarea {...register('examination_findings')} className="w-full border rounded-md p-2 h-32" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Diagnosis</label>
          <textarea {...register('diagnosis')} className="w-full border rounded-md p-2 h-20" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Treatment Plan</label>
          <textarea {...register('treatment_plan')} className="w-full border rounded-md p-2 h-32" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Prescriptions</label>
          <textarea {...register('prescriptions')} className="w-full border rounded-md p-2 h-20" />
        </div>
      </div>

      <button 
        type="submit" 
        className="bg-teal-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-teal-700"
      >
        Submit for Review
      </button>
    </form>
  )
}

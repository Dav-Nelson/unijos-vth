'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { submitClinicalRecord } from '../actions'
import { toast } from 'sonner'

const clinicalSchema = z.object({
  chief_complaint: z.string(),
  history: z.string().nullable(),
  examination_findings: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment_plan: z.string().nullable(),
  prescriptions: z.string().nullable(),
})

type ClinicalFormValues = z.infer<typeof clinicalSchema>
type InputValues = {
  chief_complaint?: string | null
  history?: string | null
  examination_findings?: string | null
  diagnosis?: string | null
  treatment_plan?: string | null
  prescriptions?: string | null
}

export function ClinicalEditor({ 
  caseId, 
  initialData 
}: { 
  caseId: string, 
  initialData: InputValues | null 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
  } = useForm<ClinicalFormValues>({
    resolver: zodResolver(clinicalSchema),
    defaultValues: {
      chief_complaint: initialData?.chief_complaint ?? '',
      history: initialData?.history ?? '',
      examination_findings: initialData?.examination_findings ?? '',
      diagnosis: initialData?.diagnosis ?? '',
      treatment_plan: initialData?.treatment_plan ?? '',
      prescriptions: initialData?.prescriptions ?? '',
    },
  })

  async function onSubmit(data: ClinicalFormValues) {
    setIsSubmitting(true)
    const result = await submitClinicalRecord(caseId, data)
    setIsSubmitting(false)

    if (!result.success) {
      toast.error('Failed to submit: ' + result.error)
    } else {
      toast.success('Clinical record submitted for review!')
    }
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
        disabled={isSubmitting}
        className="bg-teal-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-teal-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}

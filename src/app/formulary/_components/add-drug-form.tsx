'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { addDrug } from '../actions'

const schema = z.object({
  name:         z.string().min(2, 'Drug name is required'),
  generic_name: z.string().optional(),
  form:         z.enum(['TABLET', 'INJECTION', 'LIQUID', 'POWDER', 'CREAM', 'OTHER']),
  unit:         z.string().min(1, 'Unit is required (e.g. mg, mL)'),
})

type FormValues = z.infer<typeof schema>

export default function AddDrugForm({ userId }: { userId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { form: 'TABLET' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await addDrug({ ...values, created_by: userId })
    if (!result.success) {
      setServerError(result.error)
      return
    }
    reset()
    setShowForm(false)
    router.refresh()
  }

  if (!showForm) {
    return (
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-md"
        >
          + Add Drug
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-teal-200 rounded-lg p-5 mb-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Add Drug to Formulary</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-4 gap-4">

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Drug name *</label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin"
              {...register('name')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Generic name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. amoxicillin trihydrate"
              {...register('generic_name')}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form *</label>
            <select
              {...register('form')}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="TABLET">Tablet</option>
              <option value="INJECTION">Injection</option>
              <option value="LIQUID">Liquid</option>
              <option value="POWDER">Powder</option>
              <option value="CREAM">Cream</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Unit * <span className="font-normal text-slate-400">e.g. mg, mL, g</span>
            </label>
            <input
              type="text"
              placeholder="e.g. mg"
              {...register('unit')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                ${errors.unit ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit.message}</p>}
          </div>
        </div>

        {serverError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <p className="text-xs text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs
              font-semibold px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Adding…
              </>
            ) : 'Add Drug'}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); reset() }}
            className="border border-slate-200 text-slate-600 text-xs px-4 py-2 rounded-md
              hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

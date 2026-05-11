'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createPatientCase } from '../actions'
// import { toast } from 'sonner'

const patientSchema = z.object({
  owner_name: z.string().min(2, 'Name is required'),
  owner_phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  owner_address: z.string().optional(),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age_years: z.coerce.number().min(0).nullable().optional(),
  age_months: z.coerce.number().min(0).max(11).nullable().optional(),
  weight_kg: z.coerce.number().positive('Weight must be positive').nullable().optional(),
  sex: z.enum(['M', 'F', 'UNKNOWN']).default('UNKNOWN').nullable().optional(),
  chief_complaint: z.string().min(5, 'Complaint is required'),
  is_ambulatory: z.boolean().default(false).catch(false),
  travel_fee: z.coerce.number().default(0).catch(0),
})

type PatientFormValues = {
  owner_name: string;
  owner_phone: string;
  owner_address?: string;
  species: string;
  breed?: string;
  age_years?: number | null;
  age_months?: number | null;
  weight_kg?: number | null;
  sex?: "M" | "F" | "UNKNOWN" | null;
  chief_complaint: string;
  is_ambulatory: boolean;
  travel_fee: number;
}

export function PatientRegistrationForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      is_ambulatory: false,
      travel_fee: 0,
      sex: 'UNKNOWN'
    },
  })

  const isAmbulatory = watch('is_ambulatory')

  async function onSubmit(data: any) {
    // Cast to match CreateUserInput expectations in actions
    const result = await createPatientCase({
        ...data,
        age_years: data.age_years ?? undefined,
        age_months: data.age_months ?? undefined,
        weight_kg: data.weight_kg ?? undefined,
        sex: data.sex ?? undefined,
        travel_fee: data.travel_fee,
        is_ambulatory: data.is_ambulatory,
    } as any)
    if (!result.success) {
      console.error(result.error)
      return
    }
    console.log('Patient registered successfully!')
    router.push('/queue')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b pb-2">Owner Information</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input {...register('owner_name')} className="w-full border rounded p-2 text-sm" />
            {errors.owner_name && <p className="text-xs text-red-600">{errors.owner_name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Phone</label>
            <input {...register('owner_phone')} className="w-full border rounded p-2 text-sm" />
            {errors.owner_phone && <p className="text-xs text-red-600">{errors.owner_phone.message}</p>}
          </div>
        </div>

        {/* Patient Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b pb-2">Patient Information</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Species</label>
            <input {...register('species')} className="w-full border rounded p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-slate-700">Weight (kg)</label>
                <input type="number" step="0.1" {...register('weight_kg')} className="w-full border rounded p-2 text-sm" />
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-700">Sex</label>
                <select {...register('sex')} className="w-full border rounded p-2 text-sm bg-white">
                    <option value="UNKNOWN">Unknown</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                </select>
             </div>
          </div>
        </div>
      </div>

      {/* Ambulatory toggle */}
      <div className="flex items-center gap-2 border-t pt-4">
        <input type="checkbox" {...register('is_ambulatory')} id="is_ambulatory" />
        <label htmlFor="is_ambulatory" className="text-sm font-semibold">Ambulatory Case?</label>
      </div>

      {isAmbulatory && (
         <div className="bg-slate-50 p-4 rounded border">
            <label className="block text-xs font-semibold text-slate-700">Travel Fee</label>
            <input type="number" {...register('travel_fee')} className="w-full border rounded p-2 text-sm" />
         </div>
      )}

      <button type="submit" disabled={isSubmitting} className="bg-teal-600 text-white px-6 py-2 rounded text-sm font-semibold">
        Register Patient
      </button>
    </form>
  )
}

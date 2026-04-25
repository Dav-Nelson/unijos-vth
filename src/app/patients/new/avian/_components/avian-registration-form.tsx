'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createAvianCase } from '../actions'
import { toast } from 'sonner'

const avianSchema = z.object({
  owner_name: z.string().min(2, 'Required'),
  owner_phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone'),
  category: z.enum(['FLOCK', 'INDIVIDUAL_EXOTIC', 'POUND']),
  species: z.string().min(1, 'Required'),
  // Conditional fields
  flock_size: z.coerce.number().optional(),
  sick_count: z.coerce.number().optional(),
  avg_weight_kg: z.coerce.number().optional(),
  housing_type: z.string().optional(),
  pond_size_m2: z.coerce.number().optional(),
  fish_count_estimate: z.coerce.number().optional(),
  age_months: z.coerce.number().optional(),
  weight_kg: z.coerce.number().optional(),
})

export function AvianRegistrationForm() {
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm({ resolver: zodResolver(avianSchema) })
  const category = watch('category')

  async function onSubmit(data: any) {
    const res = await createAvianCase(data)
    if (res.success) {
      toast.success('Avian case registered')
      router.push('/queue')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div>
        <label>Category</label>
        <select {...register('category')} className="w-full border p-2 rounded">
          <option value="FLOCK">Flock (Poultry)</option>
          <option value="INDIVIDUAL_EXOTIC">Individual (Exotic Bird)</option>
          <option value="POUND">Pound (Fish)</option>
        </select>
      </div>

      {category === 'FLOCK' && (
        <>
          <input {...register('flock_size')} placeholder="Flock size" type="number" className="w-full border p-2 rounded" />
          <input {...register('sick_count')} placeholder="Sick count" type="number" className="w-full border p-2 rounded" />
          <input {...register('avg_weight_kg')} placeholder="Avg weight (kg)" type="number" step="0.1" className="w-full border p-2 rounded" />
          <input {...register('housing_type')} placeholder="Housing type" className="w-full border p-2 rounded" />
        </>
      )}

      {category === 'INDIVIDUAL_EXOTIC' && (
        <>
          <input {...register('age_months')} placeholder="Age (months)" type="number" className="w-full border p-2 rounded" />
          <input {...register('weight_kg')} placeholder="Weight (kg)" type="number" step="0.1" className="w-full border p-2 rounded" />
        </>
      )}

      {category === 'POUND' && (
        <>
          <input {...register('pond_size_m2')} placeholder="Pond size (m2)" type="number" className="w-full border p-2 rounded" />
          <input {...register('fish_count_estimate')} placeholder="Fish count estimate" type="number" className="w-full border p-2 rounded" />
        </>
      )}
      
      <button className="bg-teal-600 text-white px-4 py-2 rounded">Register</button>
    </form>
  )
}

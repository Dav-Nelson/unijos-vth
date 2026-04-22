'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const addDrugSchema = z.object({
  name:         z.string().min(2, 'Drug name is required'),
  generic_name: z.string().optional(),
  form:         z.enum(['TABLET', 'INJECTION', 'LIQUID', 'POWDER', 'CREAM', 'OTHER']),
  unit:         z.string().min(1, 'Unit is required'),
  created_by:   z.string().uuid(),
})

export type AddDrugInput = z.infer<typeof addDrugSchema>
export type AddDrugResult = { success: true } | { success: false; error: string }

export async function addDrug(input: AddDrugInput): Promise<AddDrugResult> {
  const parsed = addDrugSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string
  if (!['PHARMACIST', 'ADMIN'].includes(role)) {
    return { success: false, error: 'Only pharmacists can add drugs' }
  }

  const { error } = await supabase.from('drugs').insert({
    name:         parsed.data.name,
    generic_name: parsed.data.generic_name || null,
    form:         parsed.data.form,
    unit:         parsed.data.unit,
    created_by:   parsed.data.created_by,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/formulary')
  return { success: true }
}

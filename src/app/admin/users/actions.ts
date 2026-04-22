'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const CLINIC_SCOPED_ROLES = [
  'RECEPTIONIST', 'STUDENT', 'INTERN', 'RESIDENT_VET', 'LECTURER',
] as const

const createUserSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum([
    'ADMIN', 'RECEPTIONIST', 'STUDENT', 'INTERN', 'RESIDENT_VET',
    'LECTURER', 'CONSULTANT', 'PROFESSOR', 'PHARMACIST',
  ]),
  clinic_id: z.string().nullish(),
}).refine(data => {
  if ((CLINIC_SCOPED_ROLES as readonly string[]).includes(data.role)) {
    return !!data.clinic_id
  }
  return true
}, {
  message: 'Clinic scope is required for this role',
  path: ['clinic_id'],
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export type CreateUserResult =
  | { success: true; tempPassword: string }
  | { success: false; error: string }

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { full_name, email, role } = parsed.data
  // Normalize clinic_id: null for non-clinic-scoped roles
  const clinic_id = (CLINIC_SCOPED_ROLES as readonly string[]).includes(role)
    ? (parsed.data.clinic_id ?? null)
    : null

  // Generate a readable temporary password: VTH-XXXXXX-YYYY!
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  const tempPassword = `VTH-${randomPart}-${new Date().getFullYear()}!`

  const admin = createAdminClient()

  // Step 1: Create the auth user (email_confirm skips verification email)
  // app_metadata is read by get_my_role() and get_my_clinic_id() RLS helpers —
  // must be set at creation time so RLS works immediately on first login.
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role, clinic_id: clinic_id ?? null },
  })

  if (authError) {
    return { success: false, error: authError.message }
  }

  // Step 2: Insert the app-level profile row
  const { error: dbError } = await admin.from('users').insert({
    id: authData.user.id,
    full_name,
    role,
    clinic_id,
    must_change_password: true,
  })

  if (dbError) {
    // Clean up the auth user to avoid an orphaned auth record
    await admin.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: dbError.message }
  }

  revalidatePath('/admin/users')
  return { success: true, tempPassword }
}

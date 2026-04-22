'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markNoShow(appointmentId: string) {
  const supabase = await createClient()
  await supabase
    .from('appointments')
    .update({ status: 'NO_SHOW' })
    .eq('id', appointmentId)
  revalidatePath('/queue')
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient()
  await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId)
  revalidatePath('/queue')
}

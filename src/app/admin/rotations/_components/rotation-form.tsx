'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRotation } from '../actions'

const rotationSchema = z.object({
  student_id: z.string().uuid('Required'),
  entity_id: z.string().uuid('Required'),
  entity_type: z.enum(['CLINIC', 'LAB']),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  semester: z.string().min(1, 'Required'),
})

export function RotationForm({ students, entities }: { students: any[], entities: any[] }) {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(rotationSchema) })

  async function onSubmit(data: any) {
    const res = await createRotation(data)
    if (res.success) alert('Rotation assigned!')
    else alert(res.error)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg border">
      <div>
        <label>Student</label>
        <select {...register('student_id')} className="w-full border p-2 rounded">
          {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>
      <div>
        <label>Clinic/Lab</label>
        <select {...register('entity_id')} className="w-full border p-2 rounded">
          {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input type="date" {...register('start_date')} className="border p-2 rounded" />
        <input type="date" {...register('end_date')} className="border p-2 rounded" />
      </div>
      <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded">Assign Rotation</button>
    </form>
  )
}

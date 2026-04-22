'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { lookupOwner, scheduleAppointment } from '../actions'

const schema = z.object({
  scheduled_date:  z.string().min(1, 'Date is required'),
  scheduled_time:  z.string().min(1, 'Time is required'),
  chief_complaint: z.string().min(2, 'Chief complaint is required'),
  notes:           z.string().optional(),
})
type FormValues = z.infer<typeof schema>

type Owner = { id: string; full_name: string; phone: string; address: string | null }

export default function AppointmentForm() {
  const router = useRouter()
  const [phoneInput, setPhoneInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [foundOwner, setFoundOwner] = useState<Owner | null | 'not-found'>(null)
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerAddress, setNewOwnerAddress] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduled_date: new Date().toISOString().split('T')[0],
    },
  })

  async function handlePhoneSearch() {
    if (!phoneInput.trim()) return
    setSearching(true)
    const owner = await lookupOwner(phoneInput)
    setFoundOwner(owner ?? 'not-found')
    setSearching(false)
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)

    if (!foundOwner) {
      setServerError('Search for an owner by phone number first.')
      return
    }

    const result = await scheduleAppointment({
      ...values,
      ...(foundOwner !== 'not-found'
        ? { owner_id: foundOwner.id }
        : { owner_name: newOwnerName, owner_phone: phoneInput, owner_address: newOwnerAddress }
      ),
    })

    if ('error' in result) {
      setServerError(result.error)
      return
    }

    router.push('/queue')
  }

  const todayISO = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

      {/* ── Section 1: Owner ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Owner</h2>

        {/* Phone search */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search by phone number
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={e => { setPhoneInput(e.target.value); setFoundOwner(null) }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handlePhoneSearch())}
              placeholder="e.g. 08031234567"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handlePhoneSearch}
              disabled={searching || !phoneInput.trim()}
              className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs
                font-semibold px-4 py-2 rounded-md transition-colors h-9"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {/* Existing owner found */}
        {foundOwner && foundOwner !== 'not-found' && (
          <div className="bg-teal-50 border border-teal-200 rounded-md px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-800">{foundOwner.full_name}</p>
              <p className="text-xs text-teal-600 mt-0.5">{foundOwner.phone}
                {foundOwner.address && ` · ${foundOwner.address}`}
              </p>
            </div>
            <span className="text-xs bg-teal-100 text-teal-700 font-medium px-2 py-0.5 rounded">
              Existing owner
            </span>
          </div>
        )}

        {/* Owner not found — create new */}
        {foundOwner === 'not-found' && (
          <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="text-xs font-semibold text-amber-800">
              No owner found for {phoneInput} — create a new record:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full name *</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                  placeholder="e.g. Aminu Bello"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address (optional)</label>
                <input
                  type="text"
                  value={newOwnerAddress}
                  onChange={e => setNewOwnerAddress(e.target.value)}
                  placeholder="e.g. No. 5 Zaria Rd, Jos"
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                    placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Appointment details ── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Appointment Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              min={todayISO}
              {...register('scheduled_date')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                ${errors.scheduled_date ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.scheduled_date && (
              <p className="text-xs text-red-600 mt-1">{errors.scheduled_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
            <input
              type="time"
              {...register('scheduled_time')}
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                ${errors.scheduled_time ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.scheduled_time && (
              <p className="text-xs text-red-600 mt-1">{errors.scheduled_time.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chief complaint</label>
            <input
              type="text"
              {...register('chief_complaint')}
              placeholder="Brief reason for visit"
              className={`w-full border rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                focus:border-transparent
                ${errors.chief_complaint ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.chief_complaint && (
              <p className="text-xs text-red-600 mt-1">{errors.chief_complaint.message}</p>
            )}
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any additional notes…"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800
                placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500
                focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
          <p className="text-xs text-red-700">{serverError}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm
            font-semibold px-6 py-2.5 rounded-md flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Scheduling…
            </>
          ) : 'Schedule Appointment'}
        </button>
        <a href="/queue" className="text-sm text-slate-500 hover:text-slate-700">Cancel</a>
      </div>

    </form>
  )
}

import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Stethoscope, Target, Trash2, TrendingUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Modal } from '../components/Modal'
import { SummaryBar } from '../components/SummaryBar'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { asNumber, money } from '../lib/format'
import { requiredDoctorBusiness } from '../lib/partnershipMath'
import { supabase } from '../lib/supabaseClient'

export type Doctor = { id: string; name: string; given_amount: number | string; percentage: number | string; required_business: number | string; created_at: string; doctor_entries: { business: number | string }[] }
const doctorSchema = z.object({ name: z.string().trim().min(1, 'Doctor name is required'), given_amount: z.number().min(0, 'Cannot be negative'), percentage: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%') })
type DoctorValues = z.infer<typeof doctorSchema>
export const achievedOf = (doctor: Doctor) => doctor.doctor_entries.reduce((sum, entry) => sum + asNumber(entry.business), 0)

export async function fetchDoctors() {
  const { data, error } = await supabase.from('doctors').select('id,name,given_amount,percentage,required_business,created_at,doctor_entries(business)').order('name')
  if (error) throw error
  return (data ?? []) as Doctor[]
}

function DoctorForm({ doctor, close }: { doctor?: Doctor; close: () => void }) {
  const queryClient = useQueryClient()
  const { register, watch, handleSubmit, formState: { errors, isValid } } = useForm<DoctorValues>({ resolver: zodResolver(doctorSchema), mode: 'onChange', defaultValues: { name: doctor?.name ?? '', given_amount: asNumber(doctor?.given_amount), percentage: asNumber(doctor?.percentage) } })
  const required = requiredDoctorBusiness(watch('given_amount'), watch('percentage')); const mutation = useMutation({ mutationFn: async (values: DoctorValues) => { const payload = { ...values, required_business: required ?? 0 }; const result = doctor ? await supabase.from('doctors').update(payload).eq('id', doctor.id) : await supabase.from('doctors').insert(payload); if (result.error) throw result.error }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctors'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); toast.success(doctor ? 'Doctor updated' : 'Doctor added'); close() }, onError: (error) => toast.error(error.message) })
  return <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5"><label className="form-label">Doctor name<input {...register('name')} className="input-base form-input" autoFocus />{errors.name && <span className="form-error">{errors.name.message}</span>}</label><div className="grid gap-4 sm:grid-cols-2"><label className="form-label">Given amount<input {...register('given_amount', { valueAsNumber: true })} type="number" min="0" step="0.01" className="input-base form-input" />{errors.given_amount && <span className="form-error">{errors.given_amount.message}</span>}</label><label className="form-label">Percentage (e.g. 10 for 10%)<input {...register('percentage', { valueAsNumber: true })} type="number" min="0" max="100" step="0.01" className="input-base form-input" />{errors.percentage && <span className="form-error">{errors.percentage.message}</span>}</label></div><div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><p className="text-label-md uppercase text-on-surface-variant">Required Business (auto-calculated)</p><p className="mt-1 font-heading text-headline-sm text-primary">{required === null ? '-' : money(required)}</p><p className="mt-1 text-label-sm normal-case text-on-surface-variant">Given Amount / (Percentage / 100)</p></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button disabled={!isValid || mutation.isPending} className="primary-button px-5 py-2.5">{mutation.isPending ? 'Saving...' : doctor ? 'Save changes' : 'Add doctor'}</button></div></form>
}

function Progress({ achieved, required }: { achieved: number; required: number }) {
  const percent = required > 0 ? Math.min((achieved / required) * 100, 100) : 0
  const color = percent >= 100 ? 'bg-primary shadow-[0_0_10px_rgba(78,222,163,.55)]' : percent >= 60 ? 'bg-amber-400' : 'bg-error'
  return <div className="min-w-44"><div className="mb-1.5 flex justify-between text-label-sm"><span>{money(achieved)}</span><span className={percent >= 100 ? 'text-primary' : percent >= 60 ? 'text-amber-400' : 'text-error'}>{Math.round(percent)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-container-highest"><div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${percent}%` }} /></div></div>
}

export function DoctorsPage() {
  const [params, setParams] = useSearchParams(); const [editing, setEditing] = useState<Doctor | null>(null); const [search, setSearch] = useState(''); const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors })
  useRealtimeRefresh(['doctors', 'doctor_entries'], ['doctors', 'doctor', 'dashboard'])
  const rows = useMemo(() => data.filter((doctor) => doctor.name.toLowerCase().includes(search.toLowerCase())), [data, search])
  const required = data.reduce((sum, doctor) => sum + asNumber(doctor.required_business), 0); const achieved = data.reduce((sum, doctor) => sum + achievedOf(doctor), 0)
  const close = () => { setEditing(null); setParams({}, { replace: true }) }
  const remove = async (doctor: Doctor) => { if (!window.confirm(`Delete ${doctor.name} and all business entries?`)) return; const { error: deleteError } = await supabase.from('doctors').delete().eq('id', doctor.id); if (deleteError) return toast.error(deleteError.message); await queryClient.invalidateQueries({ queryKey: ['doctors'] }); toast.success('Doctor deleted') }
  return <><nav className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-surface-container-low/60 p-1"><Link to="/doctors/overview" className="rounded-lg px-4 py-2.5 text-on-surface-variant hover:text-primary">Overview</Link><Link to="/doctors" className="rounded-lg bg-primary/15 px-4 py-2.5 font-semibold text-primary">Manage Doctors</Link></nav><header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-label-md uppercase tracking-widest text-primary">Business commitments</p><h2 className="mt-2 font-heading text-headline-lg max-md:text-headline-md">Doctors Management</h2><p className="mt-2 text-on-surface-variant">Track required and achieved doctor business.</p></div><button onClick={() => setParams({ new: '1' })} className="primary-button flex items-center justify-center gap-2 px-5 py-3"><Plus size={18}/>Add doctor</button></header><SummaryBar items={[{ label: 'Total Doctors', value: data.length.toLocaleString(), icon: Stethoscope }, { label: 'Total Required Business', value: money(required), icon: Target }, { label: 'Total Achieved Business', value: money(achieved), icon: TrendingUp }]} /><div className="glass-card rounded-xl p-5"><label className="relative mb-5 block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} className="input-base w-full rounded-lg py-2.5 pl-10 pr-4" placeholder="Search doctors..." /></label>{error && <p className="rounded-lg bg-error-container/20 p-4 text-error">Unable to load doctors: {error.message}</p>}<div className="overflow-x-auto"><table className="data-table mobile-card-table table-doctors"><thead><tr><th>Sr#</th><th>Doctor Name</th><th>Required Business</th><th>Business Achieved</th><th>Remaining</th><th>Progress</th><th className="text-right">Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={7} className="py-12 text-center text-on-surface-variant">Loading doctors...</td></tr> : rows.length ? rows.map((doctor, index) => { const doctorAchieved = achievedOf(doctor); const doctorRequired = asNumber(doctor.required_business); const remaining = doctorRequired - doctorAchieved; return <tr key={doctor.id}><td>{index + 1}</td><td><Link to={`/doctors/${doctor.id}`} className="font-semibold hover:text-primary">{doctor.name}</Link></td><td>{money(doctorRequired)}</td><td className="text-primary">{money(doctorAchieved)}</td><td className={remaining > 0 ? 'text-error' : 'text-primary'}>{money(remaining)}</td><td><Progress achieved={doctorAchieved} required={doctorRequired}/></td><td><div className="flex flex-wrap justify-end gap-1"><Link to={`/doctors/${doctor.id}`} className="secondary-button px-3 py-2 text-xs font-semibold">View Details</Link><button className="icon-button" onClick={() => setEditing(doctor)}><Pencil size={17}/></button><button className="icon-button hover:text-error" onClick={() => remove(doctor)}><Trash2 size={17}/></button></div></td></tr> }) : <tr><td colSpan={7} className="py-12 text-center text-on-surface-variant">No doctors found.</td></tr>}</tbody></table></div></div>{(params.get('new') === '1' || editing) && <Modal title={editing ? 'Edit doctor' : 'Add doctor'} onClose={close}><DoctorForm doctor={editing ?? undefined} close={close}/></Modal>}</>
}







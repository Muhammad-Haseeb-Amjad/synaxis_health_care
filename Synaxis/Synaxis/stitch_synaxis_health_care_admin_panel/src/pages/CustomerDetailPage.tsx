import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FileText, Pencil, Plus, Send, Trash2, Users, WalletCards } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Modal } from '../components/Modal'
import { SummaryBar } from '../components/SummaryBar'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { usePdfShare } from '../hooks/usePdfShare'
import { generateLedgerPdf } from '../lib/generateLedgerPdf'
import { getCompanySettings } from '../lib/pdfBranding'
import { sharePdf } from '../lib/sharePdf'
import { asNumber, money, shortDate } from '../lib/format'
import { monthTag } from '../lib/partnershipMath'
import { supabase } from '../lib/supabaseClient'

type Ledger = { id: string; customer_id: string; entry_date: string; description: string; debit: number | string; credit: number | string; created_at: string }
type Customer = { id: string; name: string; phone: string | null; opening_balance: number | string; created_at: string }
const customerSchema = z.object({ name: z.string().trim().min(1, 'Name is required'), phone: z.string().trim().refine((value) => !value || /^[+]?[-()\d\s]{7,20}$/.test(value), 'Enter a valid phone number'), opening_balance: z.number().finite() })
const ledgerSchema = z.object({ entry_date: z.string().min(1, 'Date is required'), description: z.string().trim().min(1, 'Description is required'), debit: z.number().min(0), credit: z.number().min(0) }).refine((value) => value.debit > 0 || value.credit > 0, { message: 'Enter a debit or credit amount', path: ['debit'] })
type CustomerValues = z.infer<typeof customerSchema>
type LedgerValues = z.infer<typeof ledgerSchema>

async function fetchDetail(id: string) {
  const [customerResult, ledgerResult, allResult] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase.from('customer_ledger').select('*').eq('customer_id', id).order('entry_date').order('created_at'),
    supabase.from('customers').select('opening_balance,customer_ledger(debit,credit)'),
  ])
  if (customerResult.error) throw customerResult.error
  if (ledgerResult.error) throw ledgerResult.error
  if (allResult.error) throw allResult.error
  const all = allResult.data ?? []
  return { customer: customerResult.data as Customer, ledger: (ledgerResult.data ?? []) as Ledger[], totalCustomers: all.length, totalOutstanding: all.reduce((sum, row) => { const balance = asNumber(row.opening_balance) + (row.customer_ledger ?? []).reduce((part, item) => part + asNumber(item.debit) - asNumber(item.credit), 0); return sum + Math.max(balance, 0) }, 0) }
}

function CustomerEditForm({ customer, close }: { customer: Customer; close: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<CustomerValues>({ resolver: zodResolver(customerSchema), mode: 'onChange', defaultValues: { name: customer.name, phone: customer.phone ?? '', opening_balance: asNumber(customer.opening_balance) } })
  const mutation = useMutation({ mutationFn: async (values: CustomerValues) => { const { error } = await supabase.from('customers').update({ ...values, phone: values.phone || null }).eq('id', customer.id); if (error) throw error }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customer', customer.id] }); queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer updated'); close() }, onError: (error) => toast.error(error.message) })
  return <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5"><label className="form-label">Name<input {...register('name')} className="input-base form-input" />{errors.name && <span className="form-error">{errors.name.message}</span>}</label><label className="form-label">Phone<input {...register('phone')} className="input-base form-input" />{errors.phone && <span className="form-error">{errors.phone.message}</span>}</label><label className="form-label">Opening balance<input {...register('opening_balance', { valueAsNumber: true })} type="number" step="0.01" className="input-base form-input" />{errors.opening_balance && <span className="form-error">{errors.opening_balance.message}</span>}</label><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button disabled={!isValid || mutation.isPending} className="primary-button px-5 py-2.5">Save changes</button></div></form>
}

function LedgerForm({ customerId, row, close }: { customerId: string; row?: Ledger; close: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<LedgerValues>({ resolver: zodResolver(ledgerSchema), mode: 'onChange', defaultValues: { entry_date: row?.entry_date ?? new Date().toISOString().slice(0, 10), description: row?.description ?? '', debit: asNumber(row?.debit), credit: asNumber(row?.credit) } })
  const mutation = useMutation({ mutationFn: async (values: LedgerValues) => { const payload = { ...values, customer_id: customerId }; const result = row ? await supabase.from('customer_ledger').update(payload).eq('id', row.id) : await supabase.from('customer_ledger').insert(payload); if (result.error) throw result.error }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customer', customerId] }); queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); toast.success(row ? 'Ledger entry updated' : 'Ledger entry added'); close() }, onError: (error) => toast.error(error.message) })
  return <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5"><label className="form-label">Date<input {...register('entry_date')} type="date" className="input-base form-input" />{errors.entry_date && <span className="form-error">{errors.entry_date.message}</span>}</label><label className="form-label">Description<input {...register('description')} className="input-base form-input" />{errors.description && <span className="form-error">{errors.description.message}</span>}</label><div className="grid gap-4 md:grid-cols-2"><label className="form-label">Debit<input {...register('debit', { valueAsNumber: true })} type="number" min="0" step="0.01" className="input-base form-input" />{errors.debit && <span className="form-error">{errors.debit.message}</span>}</label><label className="form-label">Credit<input {...register('credit', { valueAsNumber: true })} type="number" min="0" step="0.01" className="input-base form-input" />{errors.credit && <span className="form-error">{errors.credit.message}</span>}</label></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button disabled={!isValid || mutation.isPending} className="primary-button px-5 py-2.5">{row ? 'Save entry' : 'Add entry'}</button></div></form>
}

export function CustomerDetailPage() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const queryClient = useQueryClient()
  const [editCustomer, setEditCustomer] = useState(false); const [ledgerModal, setLedgerModal] = useState<Ledger | 'new' | null>(null); const { isSharing, runPdfShare } = usePdfShare()
  const { data, isLoading, error } = useQuery({ queryKey: ['customer', id], queryFn: () => fetchDetail(id), enabled: Boolean(id) })
  useRealtimeRefresh(['customers', 'customer_ledger'], ['customer', 'customers', 'dashboard'])
  const rows = useMemo(() => { let balance = asNumber(data?.customer.opening_balance); return (data?.ledger ?? []).map((row) => { balance += asNumber(row.debit) - asNumber(row.credit); return { ...row, runningBalance: balance } }) }, [data])
  const removeEntry = async (row: Ledger) => { if (!window.confirm('Delete this ledger entry?')) return; const { error: deleteError } = await supabase.from('customer_ledger').delete().eq('id', row.id); if (deleteError) return toast.error(deleteError.message); await queryClient.invalidateQueries({ queryKey: ['customer', id] }); toast.success('Ledger entry deleted') }
  const removeCustomer = async () => { if (!data || !window.confirm(`Delete ${data.customer.name} and the complete ledger?`)) return; const { error: deleteError } = await supabase.from('customers').delete().eq('id', id); if (deleteError) return toast.error(deleteError.message); toast.success('Customer deleted'); navigate('/customers') }
  const sendStatement = () => { if (!data) return; void runPdfShare(async () => { const company = await getCompanySettings(); const doc = await generateLedgerPdf({ accountType: 'Customer', name: data.customer.name, phone: data.customer.phone, openingBalance: asNumber(data.customer.opening_balance), rows }, company); return sharePdf(doc, data.customer.name.replace(/[^a-z0-9]+/gi, '-') + '-statement.pdf', data.customer.phone, 'Customer statement for ' + data.customer.name) }) }
  if (isLoading) return <p className="text-on-surface-variant">Loading customer account…</p>
  if (error || !data) return <div className="rounded-xl bg-error-container/20 p-5 text-error">Unable to load customer: {error?.message || 'Not found'}</div>
  const closingBalance = rows.at(-1)?.runningBalance ?? asNumber(data.customer.opening_balance)
  return <><Link to="/customers" className="mb-5 inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary"><ArrowLeft size={17}/>Back to customers</Link><header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-label-md uppercase tracking-widest text-primary">Customer account</p><div className="mt-2 flex items-center gap-3"><h2 className="font-heading text-headline-lg max-md:text-headline-md">{data.customer.name}</h2><button className="icon-button" onClick={() => setEditCustomer(true)} aria-label="Edit customer"><Pencil size={18}/></button></div><p className="mt-1 text-on-surface-variant">{data.customer.phone || 'No phone provided'} · Opening balance {money(asNumber(data.customer.opening_balance))}</p></div><div className="flex flex-wrap gap-3"><button onClick={sendStatement} disabled={isSharing} className="secondary-button flex items-center gap-2"><Send size={17}/>{isSharing ? 'Generating PDF…' : 'Send Statement'}</button><button onClick={() => setLedgerModal('new')} className="primary-button flex items-center gap-2 px-5 py-2.5"><Plus size={18}/>Add ledger entry</button></div></header><SummaryBar items={[{ label: 'Total Customers', value: data.totalCustomers.toLocaleString(), icon: Users }, { label: 'Total Outstanding', value: money(data.totalOutstanding), icon: WalletCards, tone: 'text-error' }, { label: 'Current Balance', value: money(closingBalance), icon: FileText, tone: closingBalance > 0 ? 'text-error' : 'text-primary' }]} /><div className="glass-card rounded-xl p-5"><div className="overflow-x-auto"><table className="data-table mobile-card-table table-customer-ledger"><thead><tr><th>Sr#</th><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Running Balance</th><th>Month (auto)</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.id}><td>{index + 1}</td><td>{shortDate(row.entry_date)}</td><td>{row.description}</td><td className="text-error">{asNumber(row.debit) ? money(asNumber(row.debit)) : '—'}</td><td className="text-primary">{asNumber(row.credit) ? money(asNumber(row.credit)) : '—'}</td><td className={row.runningBalance > 0 ? 'text-error' : 'text-primary'}>{money(row.runningBalance)}</td><td>{monthTag(row.entry_date)}</td><td><div className="flex justify-end gap-1"><button className="icon-button" onClick={() => setLedgerModal(row)}><Pencil size={17}/></button><button className="icon-button hover:text-error" onClick={() => removeEntry(row)}><Trash2 size={17}/></button></div></td></tr>) : <tr><td colSpan={8} className="py-12 text-center text-on-surface-variant">No ledger entries yet.</td></tr>}</tbody></table></div><button onClick={removeCustomer} className="mt-6 flex items-center gap-2 text-body-sm text-error/80 hover:text-error"><Trash2 size={16}/>Delete customer account</button></div>{editCustomer && <Modal title="Edit customer" onClose={() => setEditCustomer(false)}><CustomerEditForm customer={data.customer} close={() => setEditCustomer(false)}/></Modal>}{ledgerModal && <Modal title={ledgerModal === 'new' ? 'Add ledger entry' : 'Edit ledger entry'} onClose={() => setLedgerModal(null)}><LedgerForm customerId={id} row={ledgerModal === 'new' ? undefined : ledgerModal} close={() => setLedgerModal(null)}/></Modal>}</>
}




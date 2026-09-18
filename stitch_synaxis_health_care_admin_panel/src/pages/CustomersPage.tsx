import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, Download, Pencil, Plus, Search, Send, Trash2, Users, WalletCards } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Modal } from '../components/Modal'
import { SummaryBar } from '../components/SummaryBar'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { asNumber, money } from '../lib/format'
import { supabase } from '../lib/supabaseClient'
import { usePdfShare } from '../hooks/usePdfShare'
import { generateCustomersSummaryPdf } from '../lib/generateCustomersSummaryPdf'
import { getCompanySettings } from '../lib/pdfBranding'
import { sharePdf } from '../lib/sharePdf'

type Customer = { id: string; name: string; phone: string | null; opening_balance: number | string; created_at: string; customer_ledger: { debit: number | string; credit: number | string; entry_date: string }[] }
const schema = z.object({ name: z.string().trim().min(1, 'Name is required'), phone: z.string().trim().refine((value) => !value || /^[+]?[-()\d\s]{7,20}$/.test(value), 'Enter a valid phone number'), opening_balance: z.number().finite('Enter a valid number') })
type FormValues = z.infer<typeof schema>
const balanceOf = (customer: Customer) => asNumber(customer.opening_balance) + customer.customer_ledger.reduce((sum, row) => sum + asNumber(row.debit) - asNumber(row.credit), 0)

async function fetchCustomers() {
  const { data, error } = await supabase.from('customers').select('id,name,phone,opening_balance,created_at,customer_ledger(debit,credit,entry_date)').order('name')
  if (error) throw error
  return (data ?? []) as Customer[]
}

function CustomerForm({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { name: customer?.name ?? '', phone: customer?.phone ?? '', opening_balance: asNumber(customer?.opening_balance) } })
  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, phone: values.phone || null }
      const result = customer ? await supabase.from('customers').update(payload).eq('id', customer.id) : await supabase.from('customers').insert(payload)
      if (result.error) throw result.error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); toast.success(customer ? 'Customer updated' : 'Customer added'); onClose() },
    onError: (error) => toast.error(error.message),
  })
  return <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-5">
    <label className="form-label">Name<input {...register('name')} className="input-base form-input" autoFocus />{errors.name && <span className="form-error">{errors.name.message}</span>}</label>
    <label className="form-label">Phone<input {...register('phone')} className="input-base form-input" placeholder="+92 300 1234567" />{errors.phone && <span className="form-error">{errors.phone.message}</span>}</label>
    <label className="form-label">Opening balance<input {...register('opening_balance', { valueAsNumber: true })} type="number" step="0.01" className="input-base form-input" />{errors.opening_balance && <span className="form-error">{errors.opening_balance.message}</span>}</label>
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button disabled={!isValid || save.isPending} className="primary-button px-5 py-2.5">{save.isPending ? 'Saving...' : customer ? 'Save changes' : 'Add customer'}</button></div>
  </form>
}

export function CustomersPage() {
  const { isSharing, runPdfShare } = usePdfShare()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'balance'>('name')
  const queryClient = useQueryClient()
  const { data = [], isLoading, error } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers })
  useRealtimeRefresh(['customers', 'customer_ledger'], ['customers', 'dashboard'])
  const adding = params.get('new') === '1'
  const close = () => { setEditing(null); setParams({}, { replace: true }) }
  const rows = useMemo(() => data.filter((row) => `${row.name} ${row.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : balanceOf(b) - balanceOf(a)), [data, search, sort])
  const totalOutstanding = data.reduce((sum, customer) => sum + Math.max(balanceOf(customer), 0), 0)
  const sendSummary = () => { void runPdfShare(async () => { const company = await getCompanySettings(); const summaryRows = data.map((customer) => ({ name: customer.name, phone: customer.phone, balance: balanceOf(customer) })); const doc = await generateCustomersSummaryPdf(summaryRows, totalOutstanding, company); return sharePdf(doc, 'customers-summary.pdf', null, 'Customers account summary from ' + company.company_name) }) }
  const downloadSummary = () => { void runPdfShare(async () => { const company = await getCompanySettings(); const summaryRows = data.map((customer) => ({ name: customer.name, phone: customer.phone, balance: balanceOf(customer) })); const doc = await generateCustomersSummaryPdf(summaryRows, totalOutstanding, company); doc.save('customers-summary.pdf'); return 'downloaded' }) }
  const remove = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name} and all ledger entries?`)) return
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', customer.id)
    if (deleteError) return toast.error(deleteError.message)
    await queryClient.invalidateQueries({ queryKey: ['customers'] }); toast.success('Customer deleted')
  }

  return <>
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-label-md uppercase tracking-widest text-primary">Accounts receivable</p><h2 className="mt-2 font-heading text-headline-lg max-md:text-headline-md">Customers Ledger</h2><p className="mt-2 text-on-surface-variant">Live balances and monthly account activity.</p></div><div className="flex flex-col gap-3 sm:flex-row"><button onClick={downloadSummary} disabled={isSharing || !data.length} className="secondary-button flex items-center justify-center gap-2 px-5 py-3"><Download size={18}/>{isSharing ? 'Generating...' : 'Download PDF'}</button><button onClick={sendSummary} disabled={isSharing || !data.length} className="secondary-button flex items-center justify-center gap-2 px-5 py-3"><Send size={18}/>{isSharing ? 'Generating...' : 'Send Summary'}</button><button onClick={() => setParams({ new: '1' })} className="primary-button flex items-center justify-center gap-2 px-5 py-3"><Plus size={18}/>Add customer</button></div></header>
    <SummaryBar items={[{ label: 'Total Customers', value: data.length.toLocaleString(), icon: Users }, { label: 'Total Outstanding', value: money(totalOutstanding), icon: WalletCards, tone: 'text-error' }]} />
    <div className="glass-card rounded-xl p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base w-full rounded-lg py-2.5 pl-10 pr-4" placeholder="Search customers..." /></label><button onClick={() => setSort((value) => value === 'name' ? 'balance' : 'name')} className="secondary-button flex items-center justify-center gap-2"><ArrowUpDown size={17}/>Sort by {sort === 'name' ? 'balance' : 'name'}</button></div>
      {error && <p className="rounded-lg bg-error-container/20 p-4 text-error">Unable to load customers: {error.message}</p>}
      <div className="overflow-x-auto"><table className="data-table mobile-card-table table-customers"><thead><tr><th>Sr#</th><th>Name</th><th>Phone</th><th>Current Balance</th><th className="text-right">Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={5} className="py-12 text-center text-on-surface-variant">Loading customers...</td></tr> : rows.length ? rows.map((customer, index) => { const balance = balanceOf(customer); return <tr key={customer.id}><td>{index + 1}</td><td><Link className="font-semibold text-on-surface hover:text-primary" to={`/customers/${customer.id}`}>{customer.name}</Link><p className="text-label-sm text-on-surface-variant">ID: {customer.id.slice(0, 8).toUpperCase()}</p></td><td>{customer.phone || '-'}</td><td><span className={`status-chip ${balance > 0 ? 'status-danger' : 'status-good'}`}>{balance > 0 ? money(balance) : 'Settled'}</span></td><td><div className="flex flex-wrap justify-end gap-1"><Link to={`/customers/${customer.id}`} className="secondary-button px-3 py-2 text-xs font-semibold">View Details</Link><button className="icon-button" onClick={() => setEditing(customer)} aria-label={`Edit ${customer.name}`}><Pencil size={17}/></button><button className="icon-button hover:text-error" onClick={() => remove(customer)} aria-label={`Delete ${customer.name}`}><Trash2 size={17}/></button></div></td></tr> }) : <tr><td colSpan={5} className="py-12 text-center text-on-surface-variant">No customers found.</td></tr>}</tbody></table></div>
    </div>
    <CustomerMonthlySummary customers={data} />
    {(adding || editing) && <Modal title={editing ? 'Edit customer' : 'Add customer'} onClose={close}><CustomerForm customer={editing ?? undefined} onClose={close}/></Modal>}
  </>
}

export function CustomerMonthlySummary({ customers }: { customers: Customer[] }) {
  const months = Array.from({ length: 12 }, (_, index) => new Date(2000, index).toLocaleString('en', { month: 'short' }))
  return <div className="mt-8 glass-card rounded-xl p-5"><h3 className="mb-4 font-heading text-headline-sm">Monthly Summary - {new Date().getFullYear()}</h3><div className="overflow-x-auto"><table className="data-table mobile-card-table table-customer-monthly text-xs"><thead><tr><th>Customer</th>{months.map((month) => <th key={month}>{month}<span className="block text-[9px] font-normal">D / C</span></th>)}</tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td className="font-medium">{customer.name}</td>{months.map((month, index) => { const rows = customer.customer_ledger.filter((row) => new Date(`${row.entry_date}T00:00:00`).getFullYear() === new Date().getFullYear() && new Date(`${row.entry_date}T00:00:00`).getMonth() === index); const debit = rows.reduce((sum, row) => sum + asNumber(row.debit), 0); const credit = rows.reduce((sum, row) => sum + asNumber(row.credit), 0); return <td key={month} className="whitespace-nowrap"><span className="text-error">{debit ? debit.toLocaleString() : '-'}</span> / <span className="text-primary">{credit ? credit.toLocaleString() : '-'}</span></td> })}</tr>)}</tbody></table></div></div>
}




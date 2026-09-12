import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileCheck2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { money, shortDate } from '../lib/format'

export function WarrantyInvoicesPage() {
  const queryClient = useQueryClient()
  const { data = [], error, isLoading } = useQuery({
    queryKey: ['warranty-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warranty_invoices').select('*,warranty_invoice_items(id)').order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const remove = async (invoice: { id: string; invoice_number: string }) => {
    if (!window.confirm(`Delete warranty invoice ${invoice.invoice_number}? Its line items will also be deleted.`)) return
    const result = await supabase.from('warranty_invoices').delete().eq('id', invoice.id)
    if (result.error) return toast.error(`Unable to delete invoice: ${result.error.message}`)
    await queryClient.invalidateQueries({ queryKey: ['warranty-invoices'] })
    toast.success(`Warranty invoice ${invoice.invoice_number} deleted`)
  }

  return <>
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-label-md uppercase text-primary">Sales warranty</p><h2 className="font-heading text-headline-lg max-md:text-headline-md">Warranty Invoices</h2></div>
      <Link to="/warranty/new" className="primary-button flex items-center justify-center gap-2 px-5 py-3"><Plus size={18}/>New invoice</Link>
    </header>
    <div className="glass-card rounded-xl p-4 sm:p-5">
      {error && <p className="text-error">{error.message}</p>}
      <div className="overflow-x-auto max-md:overflow-visible">
        <table className="data-table mobile-card-table table-warranty-invoices">
          <thead><tr><th>Invoice</th><th>M/s</th><th>Date</th><th>Items / Summary</th><th>Net Amount</th><th>Actions</th></tr></thead>
          <tbody>{isLoading ? <tr><td colSpan={6}>Loading...</td></tr> : data.length ? data.map((invoice: any) => <tr key={invoice.id}>
            <td className="font-mono text-primary">{invoice.invoice_number}</td>
            <td>{invoice.customer_name_snapshot}</td>
            <td>{shortDate(invoice.invoice_date)}</td>
            <td>{invoice.warranty_invoice_items?.length ?? 0} / {invoice.summary_no || '-'}</td>
            <td>{money(Number(invoice.net_amount))}</td>
            <td><div className="flex flex-wrap justify-end gap-2"><Link to={`/warranty/${invoice.id}`} className="secondary-button px-3 py-2 text-xs font-semibold">View / Edit</Link><button type="button" onClick={() => remove(invoice)} className="icon-button hover:text-error" aria-label={`Delete ${invoice.invoice_number}`}><Trash2 size={17}/></button></div></td>
          </tr>) : <tr><td colSpan={6} className="py-12 text-center"><FileCheck2 className="mx-auto mb-2"/>No warranty invoices.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  </>
}
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Building2, ChevronRight, Handshake, Plus, ReceiptText, ShoppingCart, Stethoscope, TrendingUp, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { useCountUp } from '../hooks/useCountUp'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { asNumber, money, shortDate } from '../lib/format'
import { supabase } from '../lib/supabaseClient'

const startOfMonth = () => { const date = new Date(); date.setDate(1); date.setHours(0, 0, 0, 0); return date.toISOString() }
const twelveMonthsAgo = () => { const date = new Date(); date.setMonth(date.getMonth() - 11, 1); date.setHours(0, 0, 0, 0); return date }
const must = <T,>(result: { data: T | null; error: { message: string } | null }) => { if (result.error) throw new Error(result.error.message); return result.data ?? ([] as T) }

async function fetchDashboard() {
  const monthStart = startOfMonth()
  const trendStart = twelveMonthsAgo().toISOString().slice(0, 10)
  const [doctors, customers, vendors, orders, doctorEntries, partnership, recentOrders, recentCustomerLedger, recentVendorLedger] = await Promise.all([
    supabase.from('doctors').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('id,opening_balance,customer_ledger(debit,credit)'),
    supabase.from('vendors').select('id,opening_balance,vendor_ledger(debit,credit)'),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
    supabase.from('doctor_entries').select('month,business,created_at').gte('month', trendStart),
    supabase.from('partnership_sales').select('month,qty,selling_price,return_qty').gte('month', monthStart.slice(0, 10)),
    supabase.from('purchase_orders').select('id,po_number,status,total_amount,created_at,vendor_name_snapshot').order('created_at', { ascending: false }).limit(5),
    supabase.from('customer_ledger').select('id,description,debit,credit,created_at,customers(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('vendor_ledger').select('id,description,debit,credit,created_at,vendors(name)').order('created_at', { ascending: false }).limit(5),
  ])
  ;[doctors, customers, vendors, orders, doctorEntries, partnership, recentOrders, recentCustomerLedger, recentVendorLedger].forEach((result) => { if (result.error) throw new Error(result.error.message) })

  const customerRows = customers.data ?? []
  const vendorRows = vendors.data ?? []
  const entries = doctorEntries.data ?? []
  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const customerOutstanding = customerRows.reduce((sum, row) => {
    const balance = asNumber(row.opening_balance) + (row.customer_ledger ?? []).reduce((ledgerSum, item) => ledgerSum + asNumber(item.debit) - asNumber(item.credit), 0)
    return sum + Math.max(balance, 0)
  }, 0)
  const vendorPayable = vendorRows.reduce((sum, row) => {
    const balance = asNumber(row.opening_balance) + (row.vendor_ledger ?? []).reduce((ledgerSum, item) => ledgerSum + asNumber(item.debit) - asNumber(item.credit), 0)
    return sum + Math.max(balance, 0)
  }, 0)

  const months = Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(); date.setMonth(date.getMonth() - (11 - offset), 1); date.setHours(0, 0, 0, 0)
    return { key: date.toISOString().slice(0, 7), month: date.toLocaleDateString('en', { month: 'short' }), business: 0 }
  })
  entries.forEach((entry) => { const bucket = months.find((month) => month.key === String(entry.month).slice(0, 7)); if (bucket) bucket.business += asNumber(entry.business) })
  const recentLedger = [...(recentCustomerLedger.data ?? []).map((row) => ({ ...row, kind: 'Customer ledger', party: (row.customers as unknown as { name?: string } | null)?.name })), ...(recentVendorLedger.data ?? []).map((row) => ({ ...row, kind: 'Vendor ledger', party: (row.vendors as unknown as { name?: string } | null)?.name }))].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5)

  return {
    totals: {
      doctors: doctors.count ?? 0, customers: customerRows.length, vendors: vendorRows.length, orders: orders.count ?? 0,
      doctorBusiness: entries.filter((entry) => String(entry.month).startsWith(currentMonthKey)).reduce((sum, entry) => sum + asNumber(entry.business), 0),
      customerOutstanding, vendorPayable,
      partnershipRevenue: (partnership.data ?? []).reduce((sum, row) => sum + Math.max(asNumber(row.qty) - asNumber(row.return_qty), 0) * asNumber(row.selling_price), 0),
    },
    months, recentOrders: must(recentOrders), recentLedger,
  }
}

function CountValue({ value, currency = false }: { value: number; currency?: boolean }) {
  const current = useCountUp(value)
  return <span>{currency ? money(current) : Math.round(current).toLocaleString()}</span>
}

export function DashboardPage() {
  const compactChart = typeof window !== 'undefined' && window.innerWidth < 640
  useRealtimeRefresh(['doctors','doctor_entries','customers','customer_ledger','vendors','vendor_ledger','purchase_orders','partnership_sales'], ['dashboard'])
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard })
  const cards = useMemo(() => data ? [
    ['Total Doctors', data.totals.doctors, Stethoscope, false, '/doctors/overview'], ['Total Customers', data.totals.customers, Users, false, '/customers'],
    ['Total Vendors', data.totals.vendors, Building2, false, '/vendors'], ['Purchase Orders', data.totals.orders, ShoppingCart, false, '/purchase-orders'],
    ["This Month's Doctor Business", data.totals.doctorBusiness, TrendingUp, true, '/doctors/overview'], ['Customer Outstanding', data.totals.customerOutstanding, WalletCards, true, '/customers'],
    ['Payable to Vendors', data.totals.vendorPayable, ReceiptText, true, '/vendors'], ["This Month's Partnership Revenue", data.totals.partnershipRevenue, Handshake, true, '/partnership'],
  ] as const : [], [data])

  if (error) return <div className="rounded-xl border border-error/30 bg-error-container/20 p-5 text-error">Unable to load dashboard: {error.message}</div>
  return <>
    <header className="mb-8"><p className="text-label-md uppercase tracking-widest text-primary">Operations overview</p><h2 className="mt-2 font-heading text-headline-lg max-md:text-headline-md">Global Dashboard</h2><p className="mt-2 text-on-surface-variant">Live logistics, account, and partner metrics.</p></header>
    <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{isLoading ? Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-surface-container" />) : cards.map(([label, value, Icon, currency, to]) => <Link key={label} to={to} className="dashboard-stat-link group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"><GlassCard><div className="flex items-start justify-between"><p className="max-w-[75%] text-label-md uppercase text-on-surface-variant">{label}</p><div className="relative"><Icon className="text-primary transition-transform group-hover:-translate-x-3" size={22}/><ChevronRight className="absolute -right-1 top-0 text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100" size={20}/></div></div><p className="mt-4 truncate font-heading text-headline-md"><CountValue value={value} currency={currency}/></p></GlassCard></Link>)}</div>
    <div className="mb-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <GlassCard><div className="mb-6"><h3 className="font-heading text-headline-sm">Monthly business trend</h3><p className="mt-1 text-body-sm text-on-surface-variant">Doctor business across the last 12 months</p></div><div className="h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.months ?? []}><defs><linearGradient id="businessFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4edea3" stopOpacity={0.35}/><stop offset="100%" stopColor="#4edea3" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#31394d" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="month" stroke="#86948a" tickLine={false} interval={compactChart ? 1 : 0} fontSize={12}/><YAxis stroke="#86948a" tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`}/><Tooltip contentStyle={{ background: '#171f33', border: '1px solid #31394d', borderRadius: 12 }} formatter={(value) => money(Number(value))}/><Area type="monotone" dataKey="business" stroke="#4edea3" strokeWidth={3} fill="url(#businessFill)" style={{ filter: 'drop-shadow(0 0 7px rgba(78,222,163,.55))' }}/></AreaChart></ResponsiveContainer></div></GlassCard>
      <GlassCard><h3 className="font-heading text-headline-sm">Quick actions</h3><p className="mt-1 text-body-sm text-on-surface-variant">Create a new operational record</p><div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-1">{[['New purchase order','/purchase-orders/new',ShoppingCart],['New doctor','/doctors?new=1',Stethoscope],['New customer','/customers?new=1',Users],['New vendor','/vendors?new=1',Building2]].map(([label,to,Icon]) => <Link key={String(label)} to={String(to)} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[.025] px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"><span className="flex items-center gap-3"><Icon size={19}/>{String(label)}</span><Plus size={18}/></Link>)}</div></GlassCard>
    </div>
    <GlassCard><div className="mb-5 flex items-center gap-3"><Activity className="text-primary"/><div><h3 className="font-heading text-headline-sm">Recent activity</h3><p className="text-body-sm text-on-surface-variant">Latest purchase orders and ledger entries</p></div></div><div className="grid gap-6 lg:grid-cols-2"><div><p className="mb-3 text-label-md uppercase text-on-surface-variant">Purchase orders</p><div className="space-y-2">{data?.recentOrders.length ? data.recentOrders.map((order) => <Link to={`/purchase-orders/${order.id}`} key={order.id} className="flex items-center justify-between rounded-lg bg-surface-container-low/70 p-3 hover:bg-surface-container-high"><div><p className="font-medium">{order.po_number}</p><p className="text-body-sm text-on-surface-variant">{order.vendor_name_snapshot}</p></div><div className="text-right"><p>{money(asNumber(order.total_amount))}</p><p className="text-label-sm text-on-surface-variant">{new Date(order.created_at).toLocaleDateString()}</p></div></Link>) : <p className="text-body-sm text-on-surface-variant">No purchase orders yet.</p>}</div></div><div><p className="mb-3 text-label-md uppercase text-on-surface-variant">Ledger entries</p><div className="space-y-2">{data?.recentLedger.length ? data.recentLedger.map((row) => <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between rounded-lg bg-surface-container-low/70 p-3"><div><p className="font-medium">{row.party || row.kind}</p><p className="text-body-sm text-on-surface-variant">{row.description}</p></div><div className="text-right"><p>{money(Math.max(asNumber(row.debit), asNumber(row.credit)))}</p><p className="text-label-sm text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</p></div></div>) : <p className="text-body-sm text-on-surface-variant">No ledger activity yet.</p>}</div></div></div></GlassCard>
  </>
}






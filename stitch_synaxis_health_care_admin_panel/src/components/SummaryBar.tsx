import type { LucideIcon } from 'lucide-react'

export function SummaryBar({ items }: { items: { label: string; value: string; icon: LucideIcon; tone?: string }[] }) {
  return <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(({ label, value, icon: Icon, tone = 'text-primary' }) => <div key={label} className="glass-card rounded-xl p-5"><div className="flex items-center justify-between"><p className="text-label-md uppercase text-on-surface-variant">{label}</p><Icon className={tone} size={19}/></div><p className="mt-2 font-heading text-headline-md">{value}</p></div>)}</div>
}


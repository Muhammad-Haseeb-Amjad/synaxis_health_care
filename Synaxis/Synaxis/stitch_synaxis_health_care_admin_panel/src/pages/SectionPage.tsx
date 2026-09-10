import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'

export function SectionPage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
  return <><header className="mb-8"><h2 className="font-heading text-headline-lg max-md:text-headline-md">{title}</h2><p className="mt-2 text-body-md text-on-surface-variant">{description}</p></header><GlassCard><div className="flex min-h-60 flex-col items-center justify-center text-center"><div className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Icon /></div><h3 className="font-heading text-headline-sm">Ready for live data</h3><p className="mt-2 max-w-md text-body-sm text-on-surface-variant">This workspace is connected to Supabase. Records will appear here when the corresponding database phase is implemented.</p></div></GlassCard></>
}



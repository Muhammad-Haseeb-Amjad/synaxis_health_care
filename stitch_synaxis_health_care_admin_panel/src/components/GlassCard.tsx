import type { PropsWithChildren } from 'react'

export function GlassCard({ children }: PropsWithChildren) {
  return <section className="glass-card glow-hover rounded-xl p-4 sm:p-6 transition-shadow duration-300">{children}</section>
}



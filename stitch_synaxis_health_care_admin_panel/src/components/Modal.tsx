import { useEffect, useRef, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Modal({ title, onClose, children }: PropsWithChildren<{ title: string; onClose: () => void }>) {
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow }
  }, [onClose, title])

  return createPortal(<div className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-black/70 p-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="glass-card modal-glass flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface-container/95 shadow-2xl sm:max-h-[90vh]">
      <header className="z-20 flex min-h-16 shrink-0 items-center justify-between border-b border-white/10 bg-surface-container/95 px-4 py-2 backdrop-blur-xl sm:px-6"><h2 id="modal-title" className="font-heading text-headline-sm">{title}</h2><button type="button" className="icon-button shrink-0" onClick={onClose} aria-label="Close"><X size={20}/></button></header>
      <div ref={bodyRef} className="modal-scroll-body min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">{children}</div>
    </section>
  </div>, document.body)
}
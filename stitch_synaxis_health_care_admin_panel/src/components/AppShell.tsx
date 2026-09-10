import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, Box, Building2, FileCheck2, CircleHelp, Handshake, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, ShoppingCart, Stethoscope, Users, X, Zap } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/doctors/overview', label: 'Doctors', icon: Stethoscope },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/partnership', label: 'Partnership', icon: Handshake },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/warranty', label: 'Warranty', icon: FileCheck2 },
]

const quickActions = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/doctors/overview', label: 'Doctors', icon: Stethoscope },
  { to: '/doctors?new=1', label: 'Add New Doctor', icon: Plus, create: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/customers?new=1', label: 'Add New Customer', icon: Plus, create: true },
  { to: '/partnership', label: 'Partnership', icon: Handshake },
  { to: '/vendors', label: 'Vendors', icon: Building2 },
  { to: '/vendors?new=1', label: 'Add New Vendor', icon: Plus, create: true },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
  { to: '/purchase-orders/new', label: 'New Purchase Order', icon: Plus, create: true },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/warranty', label: 'Warranty', icon: FileCheck2 },
  { to: '/products?new=1', label: 'Add New Product', icon: Plus, create: true },
  { to: '/warranty', label: 'Warranty', icon: FileCheck2 },
  { to: '/warranty/new', label: 'New Warranty Invoice', icon: Plus, create: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('synaxis-sidebar-collapsed') === 'true')
  const navigate = useNavigate()
  useEffect(() => {
    if (!quickOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setQuickOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [quickOpen])
  const toggleNavigation = () => {
    if (window.innerWidth < 1024) setMobileOpen((value) => !value)
    else setCollapsed((value) => { const next = !value; localStorage.setItem('synaxis-sidebar-collapsed', String(next)); return next })
  }
  const signOut = async () => { await supabase.auth.signOut(); navigate('/login', { replace: true }) }
  const desktopWidth = collapsed ? 'lg:w-[72px]' : 'lg:w-sidebar'
  const contentOffset = collapsed ? 'lg:ml-[72px]' : 'lg:ml-sidebar'
  const headerOffset = collapsed ? 'lg:left-[72px]' : 'lg:left-sidebar'

  return <div className="relative isolate min-h-screen overflow-x-hidden bg-transparent text-on-surface">
    <div className="app-atmosphere" aria-hidden="true"><span className="atmosphere-blob atmosphere-blob-one"/><span className="atmosphere-blob atmosphere-blob-two"/><span className="atmosphere-blob atmosphere-blob-three"/><span className="atmosphere-grid"/></div>
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar-glass fixed inset-y-0 left-0 z-50 flex h-dvh w-sidebar flex-col overflow-hidden p-4 transition-[width,transform] duration-300 ease-out ${desktopWidth} lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className={`mb-4 flex min-h-14 shrink-0 items-center ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between px-3'}`}>
        <div className={`flex items-center ${collapsed ? 'lg:justify-center' : 'gap-3'}`}><div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-primary/30 shadow-[0_0_22px_rgba(78,222,163,.2)]"><img src="/assets/synaxis-login-bg.png" alt="Synaxis Health Care" className="h-full w-full object-cover" /></div><div className={collapsed ? 'lg:hidden' : ''}><h1 className="whitespace-nowrap font-heading text-headline-sm font-extrabold tracking-tight text-primary">Synaxis Health</h1><p className="text-label-sm text-on-surface-variant">Admin Terminal</p></div></div>
        <button className="icon-button text-on-surface-variant lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
      </div>
      <nav className="sidebar-nav min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">{navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link relative flex min-h-12 items-center rounded-lg transition-all duration-200 ${collapsed ? 'lg:justify-center lg:px-0' : 'gap-3 px-4'} ${isActive ? 'sidebar-link-active text-primary' : 'text-on-surface-variant/75 hover:text-on-surface'}`}><Icon className="shrink-0" size={20}/><span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>{label}</span></NavLink>)}</nav>
      <div className="mt-3 shrink-0 space-y-2 border-t border-white/10 pt-3"><NavLink to="/settings" title={collapsed ? 'Settings' : undefined} onClick={() => setMobileOpen(false)} className={({isActive}) => `sidebar-link flex min-h-12 items-center rounded-lg transition-all ${collapsed ? 'lg:justify-center lg:px-0' : 'gap-3 px-4'} ${isActive ? 'sidebar-link-active text-primary' : 'text-on-surface-variant/75 hover:text-on-surface'}`}><Settings size={20}/><span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>Settings</span></NavLink><button onClick={signOut} title={collapsed ? 'Logout' : undefined} className={`flex min-h-12 w-full items-center rounded-lg text-error/75 transition-all hover:bg-error-container/20 hover:text-error hover:shadow-[0_0_18px_rgba(255,180,171,.1)] ${collapsed ? 'lg:justify-center lg:px-0' : 'gap-3 px-4'}`}><LogOut size={20}/><span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>Logout</span></button></div>
    </aside>
    <header className={`topbar-glass fixed inset-x-0 top-0 z-30 flex h-16 items-center border-b border-white/10 px-mobile transition-[left] duration-300 ease-out sm:px-desktop ${headerOffset}`}>
      <button className="icon-button mr-1 sm:mr-3" onClick={toggleNavigation} aria-label={collapsed ? 'Expand navigation' : 'Toggle navigation'}><Menu size={21}/></button>
      <button className="icon-button sm:hidden" onClick={() => setSearchOpen(true)} aria-label="Open search"><Search size={20}/></button><label className="relative hidden w-64 sm:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18}/><input aria-label="Search" className="input-base w-full rounded-full py-2 pl-10 pr-4" placeholder="Search records..." /></label>{searchOpen && <div className="fixed inset-x-0 top-0 z-[60] flex h-16 items-center gap-2 bg-[#0b1326]/95 px-3 backdrop-blur-xl sm:hidden"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18}/><input autoFocus aria-label="Mobile search" className="input-base h-11 w-full rounded-full pl-10 pr-4" placeholder="Search records..." /></label><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={20}/></button></div>}
      <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
        <div className="relative"> <button className="quick-actions-trigger primary-button flex h-11 items-center justify-center gap-2 px-3 sm:px-4" onClick={() => setQuickOpen((value) => !value)} aria-haspopup="menu" aria-expanded={quickOpen} aria-label="Quick Actions"><Zap size={18}/><span className="hidden xl:inline">Quick Actions</span></button>{quickOpen && <><button className="fixed inset-0 z-40 cursor-default bg-black/45 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none" aria-label="Close quick actions" onClick={() => setQuickOpen(false)}/><section className="quick-actions-panel fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-50 max-h-[82dvh] overflow-y-auto rounded-2xl p-4 sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+.75rem)] sm:w-[25rem]" role="menu" aria-label="Quick Actions menu"><div className="mb-3 flex items-center justify-between"><div><p className="font-heading text-headline-sm">Quick Actions</p><p className="text-body-sm text-on-surface-variant">Navigate or create a record</p></div><button className="icon-button sm:hidden" onClick={() => setQuickOpen(false)} aria-label="Close quick actions menu"><X size={19}/></button></div><div className="grid gap-2 sm:grid-cols-2">{quickActions.map(({to,label,icon:Icon,create}) => <Link key={`${to}-${label}`} to={to} role="menuitem" onClick={() => setQuickOpen(false)} className={`quick-action-link flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 ${create ? 'border-primary/20 bg-primary/[.06] text-primary' : 'text-on-surface-variant'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${create ? 'bg-primary/15' : 'bg-white/[.05]'}`}><Icon size={18}/></span><span className="text-left text-sm font-medium">{label}</span></Link>)}</div></section></>}</div>
        <button className="icon-button" aria-label="Notifications"><Bell size={20}/></button><button className="icon-button" aria-label="Help"><CircleHelp size={20}/></button><div className="ml-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/35 bg-primary/15 font-heading text-sm font-bold text-primary shadow-[0_0_18px_rgba(78,222,163,.13)] sm:ml-1">A</div>
      </div>
    </header>
    <main className={`app-main-content relative z-10 min-h-screen px-mobile pb-12 pt-24 transition-[margin-left] duration-300 ease-out sm:px-desktop ${contentOffset}`}><div className="mx-auto max-w-content-max"><Outlet /></div></main>
  </div>
}



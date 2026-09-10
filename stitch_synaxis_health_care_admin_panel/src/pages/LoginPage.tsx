import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Download, Eye, EyeOff, LoaderCircle, Share2, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { Modal } from '../components/Modal'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || iosNavigator.standalone === true
}

function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [installed, setInstalled] = useState(isStandaloneMode)
  const isIosSafari = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const refreshInstalledState = () => setInstalled(isStandaloneMode())
    const markInstalled = () => { setInstalled(true); setPromptEvent(null); setShowHelp(false) }

    refreshInstalledState()
    window.addEventListener('beforeinstallprompt', capturePrompt)
    window.addEventListener('appinstalled', markInstalled)
    displayMode.addEventListener?.('change', refreshInstalledState)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      window.removeEventListener('appinstalled', markInstalled)
      displayMode.removeEventListener?.('change', refreshInstalledState)
    }
  }, [])

  if (installed) return null

  const install = async () => {
    if (!promptEvent) { setShowHelp(true); return }
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    setPromptEvent(null)
    if (outcome === 'accepted') setInstalled(true)
    else setShowHelp(true)
  }

  const instructions = isIosSafari
    ? <>Tap the <strong>Share</strong> button in Safari, then choose <strong>Add to Home Screen</strong>.</>
    : <>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If the native prompt becomes available again, this button will use it automatically.</>

  return <>
    <button type="button" onClick={install} className="secondary-button mt-3 flex w-full items-center justify-center gap-2 py-3">
      <img src="/icons/synaxis-icon-v4-64.png" alt="" className="h-7 w-7 rounded-full object-cover" />
      <Download size={18}/><span>Download App</span>
    </button>
    {showHelp && <Modal title="Install Synaxis Health" onClose={() => setShowHelp(false)}><div className="text-center"><div className="brand-mark mx-auto h-20 w-20 overflow-hidden rounded-full p-1"><img src="/icons/synaxis-icon-v4-192.png" alt="Synaxis Health Care" className="h-full w-full rounded-full object-cover" /></div><div className="mt-4 flex items-center justify-center gap-2 text-primary"><Share2 size={23}/><span className="font-semibold">Add to Home Screen</span></div><p className="mt-4 text-body-md text-on-surface-variant">{instructions}</p><button type="button" onClick={() => setShowHelp(false)} className="primary-button mt-6 w-full px-5 py-3">Got it</button></div></Modal>}
  </>
}
export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [failureKey, setFailureKey] = useState(0)
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), mode: 'onChange', defaultValues: { email: '', password: '' },
  })

  if (loading) return <div className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-primary" /></div>
  if (session) return <Navigate to={from} replace />

  const submit = handleSubmit(async (values) => {
    setAuthError(false)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) { setAuthError(true); setFailureKey((value) => value + 1); return }
    navigate('/', { replace: true })
  }, () => setFailureKey((value) => value + 1))

  return <main className="login-backdrop relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
    <div className="login-grid absolute inset-0 opacity-35" /><div className="login-orb login-orb-primary" /><div className="login-orb login-orb-secondary" />
    <section className="relative z-10 w-[calc(100vw-2rem)] min-w-0 max-w-md">
      <div className="login-halo absolute -inset-10 rounded-[3rem]" />
      <form onSubmit={submit} noValidate className={`glass-card login-card relative rounded-xl p-8 shadow-2xl md:p-10 ${failureKey ? 'animate-shake' : ''}`}>
        <header className="mb-8 text-center">
          <div className="brand-mark mx-auto mb-5 h-20 w-20 overflow-hidden rounded-full p-1"><img src="/assets/synaxis-login-bg.png" alt="Synaxis Health Care" className="h-full w-full rounded-full object-cover" /></div>
          <p className="mb-2 font-heading text-label-md font-bold uppercase tracking-[0.22em] text-primary">Synaxis Health Care</p>
          <h1 className="font-heading text-headline-lg text-on-surface max-md:text-headline-md">Admin sign in</h1>
          <p className="mt-2 text-body-sm text-on-surface-variant">Secure access to your healthcare operations.</p>
        </header>
        {authError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-error/25 bg-error-container/20 p-3 text-body-sm text-error"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>Invalid email or password. Please check your credentials and try again.</span></div>}
        <div className="space-y-5">
          <label className="block text-label-md uppercase text-on-surface-variant">Email
            <input {...register('email')} type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={`input-base mt-2 w-full rounded-lg px-4 py-3 normal-case tracking-normal ${errors.email ? 'border-error/70 focus:border-error focus:ring-error/10' : ''}`} placeholder="admin@synaxis.health" />
            {errors.email && <span className="mt-1.5 block text-body-sm normal-case tracking-normal text-error">{errors.email.message}</span>}
          </label>
          <label className="block text-label-md uppercase text-on-surface-variant">Password
            <span className="relative mt-2 block">
              <input {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={Boolean(errors.password)} className={`input-base w-full rounded-lg py-3 pl-4 pr-12 normal-case tracking-normal ${errors.password ? 'border-error/70 focus:border-error focus:ring-error/10' : ''}`} placeholder="Enter your password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant transition hover:bg-white/5 hover:text-primary" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </span>
            {errors.password && <span className="mt-1.5 block text-body-sm normal-case tracking-normal text-error">{errors.password.message}</span>}
          </label>
        </div>
        <button disabled={!isValid || isSubmitting} className="primary-button mt-7 flex w-full items-center justify-center gap-2 py-3.5">{isSubmitting ? <LoaderCircle className="animate-spin" size={19} /> : <ShieldCheck size={19} />}{isSubmitting ? 'Signing in…' : 'Secure sign in'}</button>
        <InstallAppButton />
        <p className="mt-6 text-center text-label-sm text-on-surface-variant/80">Protected by Supabase authentication</p>
      </form>
    </section>
  </main>
}


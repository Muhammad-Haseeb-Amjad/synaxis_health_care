import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function ConfigurationError() {
  return <main className="grid min-h-screen place-items-center p-6">
    <section className="glass-card w-full max-w-xl rounded-2xl border border-error/30 p-8 text-center shadow-2xl">
      <p className="text-label-md uppercase tracking-widest text-error">Deployment configuration required</p>
      <h1 className="mt-3 font-heading text-headline-lg">Synaxis Health cannot connect</h1>
      <p className="mt-4 text-on-surface-variant">The Supabase environment variables were not included in this build.</p>
      <div className="mt-6 rounded-xl bg-surface-container-low p-4 text-left font-mono text-body-sm">
        <p>VITE_SUPABASE_URL</p>
        <p className="mt-2">VITE_SUPABASE_ANON_KEY</p>
      </div>
      <p className="mt-5 text-body-sm text-on-surface-variant">Add both values in Vercel Project Settings → Environment Variables, enable Production, then redeploy.</p>
    </section>
  </main>
}

async function bootstrap() {
  if (!supabaseUrl || !supabaseAnonKey) {
    root.render(<StrictMode><ConfigurationError /></StrictMode>)
    return
  }

  const { default: App } = await import('./App')
  root.render(<StrictMode><BrowserRouter><App /></BrowserRouter><Toaster position="top-right" toastOptions={{ style: { background: '#171f33', color: '#dae2fd', border: '1px solid rgba(255,255,255,.1)' } }} /></StrictMode>)
}

void bootstrap()
import { useQuery } from '@tanstack/react-query'
import { Stethoscope, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SummaryBar } from '../components/SummaryBar'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import { asNumber, money } from '../lib/format'
import { achievedOf, fetchDoctors } from './DoctorsPage'

export function DoctorsOverviewPage() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['doctors'], queryFn: fetchDoctors })
  useRealtimeRefresh(['doctors', 'doctor_entries'], ['doctors', 'doctor', 'dashboard'])
  const required = data.reduce((sum, doctor) => sum + asNumber(doctor.required_business), 0)
  const achieved = data.reduce((sum, doctor) => sum + achievedOf(doctor), 0)

  return <>
    <nav className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-surface-container-low/60 p-1"><Link to="/doctors/overview" className="rounded-lg bg-primary/15 px-4 py-2.5 font-semibold text-primary">Overview</Link><Link to="/doctors" className="rounded-lg px-4 py-2.5 text-on-surface-variant hover:text-primary">Manage Doctors</Link></nav>
    <header className="mb-6"><p className="text-label-md uppercase tracking-widest text-primary">Workbook overview</p><h2 className="mt-2 font-heading text-headline-lg max-md:text-headline-md">All Doctors Overview</h2><p className="mt-2 text-on-surface-variant">Live targets and achievement totals from every doctor's monthly transactions.</p></header>
    <SummaryBar items={[{ label: 'Total Doctors', value: data.length.toLocaleString(), icon: Stethoscope }, { label: 'Total Required Business', value: money(required), icon: Target }, { label: 'Total Achieved Business', value: money(achieved), icon: TrendingUp }]} />
    <section className="glass-card rounded-xl p-5">{error && <p className="mb-4 rounded-lg bg-error-container/20 p-4 text-error">Unable to load doctors: {error.message}</p>}<div className="overflow-x-auto"><table className="data-table mobile-card-table table-doctor-overview"><thead><tr><th>Sr#</th><th>Doctor Name</th><th>Required Business</th><th>Business Achieved</th><th>Remaining Business</th><th>Actions</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">Loading overview...</td></tr> : data.length ? data.map((doctor,index) => { const doctorRequired=asNumber(doctor.required_business); const doctorAchieved=achievedOf(doctor); const remaining=doctorRequired-doctorAchieved; return <tr key={doctor.id}><td>{index+1}</td><td><Link to={`/doctors/${doctor.id}`} className="font-semibold hover:text-primary">{doctor.name}</Link></td><td>{money(doctorRequired)}</td><td className="text-primary">{money(doctorAchieved)}</td><td className={remaining > 0 ? 'text-error' : 'text-primary'}>{money(remaining)}</td><td><Link to={`/doctors/${doctor.id}`} className="secondary-button inline-flex px-3 py-2 text-xs font-semibold">View Details</Link></td></tr> }) : <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">No doctors yet. Add one from Manage Doctors.</td></tr>}</tbody></table></div></section>
  </>
}
import type { jsPDF } from 'jspdf'
import { supabase } from './supabaseClient'

export type CompanySettings = { id?: string; company_name: string; admin_name: string | null; phone: string | null; email: string | null; logo_url: string | null; address: string | null; distributor_commission_percent?: number | string; warranty_authorized_person?: string | null; warranty_business_address?: string | null }
export const defaultCompanySettings: CompanySettings = { company_name: 'Synaxis Health Care', admin_name: null, phone: null, email: null, logo_url: null, address: null, distributor_commission_percent: 10 }

export async function getCompanySettings() {
  const { data, error } = await supabase.from('company_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return (data as CompanySettings | null) ?? defaultCompanySettings
}

async function imageData(url: string) {
  const response = await fetch(url); if (!response.ok) throw new Error('Unable to load company logo')
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob) })
}

export async function drawBrandHeader(doc: jsPDF, company: CompanySettings, title: string, options?: { companyNameHeading?: boolean }) {
  doc.setFillColor(248, 250, 252); doc.circle(196, 12, 26, 'F'); doc.setFillColor(236, 253, 245); doc.circle(8, 286, 28, 'F')
  let textX = 14
  const logoUrl = company.logo_url || '/assets/synaxis-login-bg.png'
  try { const data = await imageData(logoUrl); const format = data.includes('image/png') ? 'PNG' : data.includes('image/webp') ? 'WEBP' : 'JPEG'; doc.addImage(data, format, 14, 10, 24, 24, undefined, 'FAST'); textX = 43 } catch { /* keep textual branding when the image is unavailable */ }
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(options?.companyNameHeading ? 14 : 11); doc.text(options?.companyNameHeading ? company.company_name.toUpperCase() : company.admin_name || company.company_name, textX, 16)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(71, 85, 105)
  const contacts = [company.phone, company.email, company.address].filter(Boolean) as string[]; contacts.forEach((line, index) => doc.text(line, textX, 21 + index * 4))
  doc.setFont('helvetica', 'bold'); doc.setFontSize(21); doc.setTextColor(5, 15, 30); doc.text(title, 196, 20, { align: 'right' })
  doc.setDrawColor(203, 213, 225); doc.line(14, 37, 196, 37)
}



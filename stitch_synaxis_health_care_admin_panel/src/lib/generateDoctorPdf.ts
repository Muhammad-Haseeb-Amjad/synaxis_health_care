import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { asNumber, money } from './format'
import { drawBrandHeader, type CompanySettings } from './pdfBranding'

export type DoctorReportData = { name: string; givenAmount: number; percentage: number; requiredBusiness: number; achievedBusiness: number; remainingBusiness: number; entries: { month: string; product_name: string; qty: number | string; price: number | string; business: number | string }[] }
export async function generateDoctorPdf(data: DoctorReportData, company: CompanySettings) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  await drawBrandHeader(doc, company, 'DOCTOR BUSINESS REPORT')
  doc.setTextColor(15,23,42); doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text(data.name,14,50)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(71,85,105)
  doc.text(`Given Amount: ${money(data.givenAmount)}    Percentage: ${data.percentage}%    Required Business: ${money(data.requiredBusiness)}`,14,57)
  autoTable(doc,{startY:66,margin:{left:14,right:14},head:[['SR#','MONTH','PRODUCT NAME','QTY','PRICE (RS)','BUSINESS (RS)']],body:data.entries.map((entry,index)=>[String(index+1),new Date(`${entry.month}T00:00:00`).toLocaleDateString('en',{month:'short',year:'numeric'}),entry.product_name,asNumber(entry.qty).toLocaleString(),money(asNumber(entry.price)),money(asNumber(entry.business))]),theme:'grid',headStyles:{fillColor:[5,15,30],textColor:[255,255,255],fontSize:7.5},alternateRowStyles:{fillColor:[241,245,249]},styles:{fontSize:8,textColor:[30,41,59]},columnStyles:{0:{cellWidth:13,halign:'center'},1:{cellWidth:25},2:{cellWidth:62},3:{cellWidth:18,halign:'right'},4:{halign:'right'},5:{halign:'right',fontStyle:'bold'}}})
  const end=(doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY
  doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(15,23,42); doc.text('BUSINESS ACHIEVED',116,end+10); doc.text(money(data.achievedBusiness),192,end+10,{align:'right'}); doc.text('REMAINING BUSINESS',116,end+18); doc.setTextColor(data.remainingBusiness>0?180:20,data.remainingBusiness>0?83:130,data.remainingBusiness>0?9:85); doc.text(money(data.remainingBusiness),192,end+18,{align:'right'})
  doc.setFontSize(7); doc.setTextColor(148,163,184); doc.text(company.company_name,14,288); doc.text(`Generated ${new Date().toLocaleDateString()}`,196,288,{align:'right'})
  return doc
}
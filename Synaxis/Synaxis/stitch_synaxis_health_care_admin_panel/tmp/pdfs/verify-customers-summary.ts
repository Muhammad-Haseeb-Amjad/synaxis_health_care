import { writeFile } from 'node:fs/promises'
import { generateCustomersSummaryPdf } from '../../src/lib/generateCustomersSummaryPdf'
import { defaultCompanySettings } from '../../src/lib/pdfBranding'

const rows = [
  { name: 'Al-Shifa Pharmacy', phone: '0300-1234567', balance: 12750 },
  { name: 'City Medical Store', phone: '0301-2345678', balance: 8300 },
  { name: 'Madina Pharmacy', phone: null, balance: 4250 },
]
for (const [name, total] of [['customers-summary-small', 950] as const, ['customers-summary-large', 987654] as const]) {
  const doc = await generateCustomersSummaryPdf(rows, total, defaultCompanySettings)
  await writeFile(`output/pdf/${name}.pdf`, Buffer.from(doc.output('arraybuffer')))
}
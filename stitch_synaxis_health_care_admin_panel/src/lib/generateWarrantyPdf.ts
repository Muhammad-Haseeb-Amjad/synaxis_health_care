import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CompanySettings } from './pdfBranding'
export type WarrantyLine={qty:number;bns:number;description:string;pack:string;batch_number:string;expiry_date:string;rate:number;sales_tax:number;advance_tax:number;discount_percent:number}
export type WarrantyData={invoice_number:string;customer_name_snapshot:string;customer_address_snapshot:string;invoice_date:string;city:string;sector:string;salesman:string;phone:string;username:string;summary_no:string;page_label:string;x_discount:number;grn_amount:number;credit_note:number;items:WarrantyLine[];authorizedPerson?:string;businessAddress?:string}
const num=(v:number)=>Number(v)||0
const amt=(v:number)=>num(v).toLocaleString('en-PK',{minimumFractionDigits:2,maximumFractionDigits:2})
const date=(v:string)=>{const[y,m,d]=v.split('-');return y&&m&&d?`${d}/${m}/${y}`:v}
async function imageData(url:string){const r=await fetch(url);if(!r.ok)throw new Error('Image unavailable');const b=await r.blob();return new Promise<string>((ok,no)=>{const x=new FileReader();x.onload=()=>ok(String(x.result));x.onerror=()=>no(x.error);x.readAsDataURL(b)})}
function field(doc:jsPDF,label:string,value:string,x:number,y:number,vx:number){doc.setFont('helvetica','bold');doc.text(label,x,y);doc.setFont('helvetica','normal');doc.text(value||'-',vx,y)}
export async function generateWarrantyPdf(data:WarrantyData,company:CompanySettings){
 const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});doc.setTextColor(0,0,0);doc.setDrawColor(0,0,0)
 // Fixed client-approved reference letterhead; Synaxis branding remains only in the signature block.
 doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text('AXIM HEALTH CARE',14,15)
 doc.setFont('helvetica','normal');doc.setFontSize(6.8);doc.text('House#120, St#13, Qayam Block Mustafa Town Wahdat',14,20);doc.text('road Lahore. Cell#:0321-7577880',14,23.5)
 doc.setLineWidth(.45);doc.line(14,26,154,26);doc.line(14,27.4,154,27.4)
 doc.setFont('helvetica','bold');doc.text('InvoiceNo.',149,11);doc.setFont('helvetica','normal');doc.text(data.invoice_number||'-',172,11);doc.line(168,12.4,198,12.4)
 doc.setFont('times','bold');doc.setFontSize(13);doc.text('INVOICE',198,26,{align:'right'});doc.setFont('times','normal');doc.setFontSize(7);doc.text('DUPLICATE',198,30,{align:'right'})
 doc.setFontSize(7);field(doc,'M/s:',data.customer_name_snapshot,14,34,28);field(doc,'Address:',data.customer_address_snapshot,14,40,28);field(doc,'City:',data.city,14,45,28);field(doc,'Phone:',data.phone,14,50,28);field(doc,'Sector:',data.sector,91,45,108);field(doc,'Date.',date(data.invoice_date),146,38,166);field(doc,'Salesman.',data.salesman,146,43,166);field(doc,'SummaryNo.',data.summary_no,146,48,166);field(doc,'UserName:',data.username,91,54,108);doc.setFont('helvetica','normal');doc.text(`Page${(data.page_label||'1 of 1').replace(/\s+/g,'')}`,198,54,{align:'right'})
 const rows=data.items.map(i=>{const gross=num(i.qty)*num(i.rate),discount=gross*num(i.discount_percent)/100,net=gross-discount-num(i.sales_tax)-num(i.advance_tax);return[i.qty,i.bns,i.description,i.pack||'-',i.batch_number||'-',amt(i.rate),amt(gross),amt(i.sales_tax),amt(i.advance_tax),`${num(i.discount_percent).toFixed(0)}%`,amt(net)]})
 autoTable(doc,{startY:58,head:[['Qty','Bns','Description','Pack','Batch#','Rate','Amount','S-Tax','A-Tax','Discount','NetAmount']],body:rows,theme:'grid',margin:{left:11,right:11},styles:{font:'helvetica',fontSize:6.3,cellPadding:1,textColor:[0,0,0],lineColor:[0,0,0],lineWidth:.15,fillColor:[255,255,255],valign:'middle'},headStyles:{fontStyle:'normal',fillColor:[198,198,198],textColor:[0,0,0],halign:'center'},bodyStyles:{fillColor:[255,255,255]},columnStyles:{0:{cellWidth:11},1:{cellWidth:10},2:{cellWidth:35},3:{cellWidth:12},4:{cellWidth:17},5:{cellWidth:16},6:{cellWidth:20},7:{cellWidth:15},8:{cellWidth:15},9:{cellWidth:18},10:{cellWidth:19}}})
 const gross=data.items.reduce((s,i)=>s+num(i.qty)*num(i.rate),0),discount=data.items.reduce((s,i)=>s+num(i.qty)*num(i.rate)*num(i.discount_percent)/100,0),salesTax=data.items.reduce((s,i)=>s+num(i.sales_tax),0),advanceTax=data.items.reduce((s,i)=>s+num(i.advance_tax),0),net=gross-discount-num(data.x_discount)-num(data.grn_amount)-num(data.credit_note)-salesTax-advanceTax
 const ty=213,left=11,cw=20,totals=[['GrossAmount',gross],['Discount',discount],['X.Discount',data.x_discount],['GRNAmt.',data.grn_amount],['CreditNote',data.credit_note],['SalesTax',salesTax],['AdvanceTax',advanceTax]] as const
 doc.setFontSize(5.5);totals.forEach(([label,value],i)=>{const x=left+i*cw;doc.setFillColor(198,198,198);doc.rect(x,ty,cw,4.5,'FD');doc.rect(x,ty+4.5,cw,7,'S');doc.setFont('helvetica','normal');doc.text(label,x+cw/2,ty+3.2,{align:'center'});doc.text(amt(num(value)),x+cw-1,ty+9,{align:'right'})})
 const nl=left+totals.length*cw;doc.rect(nl,ty,48,11.5,'S');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('NetAmount:',nl+3,ty+7.2);doc.setFontSize(9);doc.text(amt(net),nl+45,ty+7.2,{align:'right'})
 doc.setFont('helvetica','bold');doc.setFontSize(6);doc.text(`NO.OFITEMS:                 ${data.items.length}`,11,228);doc.setLineWidth(.25);doc.line(11,231,199,231)
 const person='Ihsan Ul Allah Shahid',address=data.businessAddress||company.warranty_business_address||company.address||'[address]';const clause=`WARRANTY under section 23(1)(i) of the Drug Act 1976. ${person}, being a person resident in Pakistan carrying on business at ${address} under the name AXIM HEALTH CARE and being an authorised agent of the drugs, do hereby give this warranty that the drug sold by us do not contravene in any way the provisions of section 23 of the drug act 1976.`
 // Keep the larger warranty copy inside the invoice's 11 mm side margins.
 doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('WARRANTY',11,237)
 // Measure each run in its actual font so the emphasized name wraps within the margins.
 const [beforeName,afterName]=clause.split(person)
 const runs=[
  ...beforeName.trimEnd().split(/\s+/).map(text=>({text,bold:false})),
  {text:person+',',bold:true},
  ...afterName.replace(/^,\s*/, '').split(/\s+/).map(text=>({text,bold:false})),
 ]
 let textX=11,textY=242
 const lineHeight=9.5*1.2/doc.internal.scaleFactor
 for(const run of runs){
  doc.setFont('helvetica',run.bold?'bold':'normal');doc.setFontSize(run.bold?9.5:8.5)
  const width=doc.getTextWidth(run.text)
  if(textX+width>199){textX=11;textY+=lineHeight}
  doc.text(run.text,textX,textY)
  textX+=width+doc.getTextWidth(' ')
 }
 const notesY=textY+6
 doc.setFont('helvetica','normal');doc.setFontSize(6.5)
 const notes=[
  'Note: For dated items we must be informed six months prior to expiry.',
  'Note: Herbal, Food, Unani, Cosmetic, Nutritional & Hemoproducts do not fall under this warranty.',
 ]
 let nextY=notesY
 for(const note of notes){const lines=doc.splitTextToSize(note,137);doc.text(lines,11,nextY);nextY+=lines.length*3+1}
 try{doc.addImage(await imageData('/assets/image.png'),'PNG',22,nextY,94,13.6,undefined,'FAST')}catch{}
 const sc=172,signatureY=notesY-2
 try{doc.addImage(await imageData('/assets/signature.png'),'PNG',sc-19,signatureY,38,15,undefined,'FAST')}catch{}
 doc.line(sc-22,signatureY+17,sc+22,signatureY+17);doc.setFont('helvetica','normal');doc.setFontSize(5.5);doc.text('For',sc-24,signatureY+21);doc.setFont('helvetica','bold');doc.text(company.company_name.replace(/\s+/g,'').toUpperCase(),sc,signatureY+21,{align:'center'})
 doc.setFont('helvetica','normal');doc.setTextColor(80,80,80);doc.setFontSize(5.5);doc.text(`Printed: ${new Date().toLocaleString('en-PK')}`,11,291);return doc
}

import type { jsPDF } from 'jspdf'


export function downloadPdf(doc: jsPDF, filename: string) {
  const blob = doc.output('blob')
  if (!blob.size || blob.type !== 'application/pdf') throw new Error('The PDF could not be generated correctly. Please try again.')
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
export async function sharePdf(doc: jsPDF, filename: string, _phone: string | null | undefined, message: string) {
  // jsPDF produces the Blob synchronously. Do not await before navigator.share:
  // mobile browsers require the call to retain the originating user activation.
  const generatedBlob = doc.output('blob')
  if (!generatedBlob.size || generatedBlob.type !== 'application/pdf') {
    throw new Error('The PDF could not be generated correctly. Please try again.')
  }

  const file = new File([generatedBlob], filename, { type: 'application/pdf', lastModified: Date.now() })
  const diagnostics = {
    name: file.name,
    size: file.size,
    type: file.type,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    userAgent: navigator.userAgent,
  }

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    const startedAt = performance.now()
    console.info('[PDF share] Calling navigator.share', diagnostics)
    try {
      // This is deliberately the first asynchronous boundary in this function.
      await navigator.share({ files: [file], title: filename, text: message })
      console.info('[PDF share] navigator.share resolved', { ...diagnostics, elapsedMs: Math.round(performance.now() - startedAt) })
      return 'shared' as const
    } catch (error) {
      console.error('[PDF share] navigator.share rejected', {
        ...diagnostics,
        elapsedMs: Math.round(performance.now() - startedAt),
        errorName: error instanceof DOMException ? error.name : 'Error',
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  console.info('[PDF share] Native file sharing unavailable; downloading', diagnostics)
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  window.alert('PDF downloaded - open WhatsApp and attach it manually. This browser cannot share PDF files directly.')
  return 'downloaded' as const
}
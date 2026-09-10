import type { jsPDF } from 'jspdf'

function pdfSignature(bytes: Uint8Array) {
  return new TextDecoder('ascii').decode(bytes.slice(0, 5))
}

export async function sharePdf(doc: jsPDF, filename: string, _phone: string | null | undefined, message: string) {
  const generatedBlob = doc.output('blob')
  const bytes = new Uint8Array(await generatedBlob.arrayBuffer())
  const signature = pdfSignature(bytes)

  if (!bytes.byteLength || signature !== '%PDF-') {
    console.error('[PDF share] Generated document is invalid', { filename, byteLength: bytes.byteLength, signature })
    throw new Error('The PDF could not be generated correctly. Please try again.')
  }

  // Build the shared file from fully-read bytes so the browser receives a stable,
  // complete payload rather than a lazily consumed Blob.
  const file = new File([bytes], filename, { type: 'application/pdf', lastModified: Date.now() })
  const diagnostics = {
    name: file.name,
    size: file.size,
    type: file.type,
    signature,
    standalone: window.matchMedia('(display-mode: standalone)').matches,
    userAgent: navigator.userAgent,
  }

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    const startedAt = performance.now()
    console.info('[PDF share] Calling navigator.share', diagnostics)
    try {
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
  window.alert('PDF downloaded — open WhatsApp and attach it manually. This browser cannot share PDF files directly.')
  return 'downloaded' as const
}
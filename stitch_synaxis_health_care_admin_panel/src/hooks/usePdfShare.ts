import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

export function usePdfShare() {
  const [isSharing, setIsSharing] = useState(false)
  const runPdfShare = useCallback(async (createAndShare: () => Promise<'shared' | 'downloaded'>) => {
    if (isSharing) return
    setIsSharing(true)
    try {
      const result = await createAndShare()
      toast.success(result === 'shared' ? 'PDF shared successfully' : 'PDF downloaded — attach it in WhatsApp')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') toast.error((error as Error).message || 'Unable to generate the PDF')
    } finally {
      setIsSharing(false)
    }
  }, [isSharing])
  return { isSharing, runPdfShare }
}
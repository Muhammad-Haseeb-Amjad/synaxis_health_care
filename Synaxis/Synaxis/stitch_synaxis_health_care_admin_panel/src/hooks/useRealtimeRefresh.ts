import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeRefresh(tables: string[], queryKeys: string[]) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = tables.reduce(
      (current, table) => current.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      }),
      supabase.channel(`realtime-${tables.join('-')}`),
    ).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [queryClient, tables.join('|'), queryKeys.join('|')])
}


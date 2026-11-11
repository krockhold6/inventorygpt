import { createClient } from '@supabase/supabase-js'
import { createSdtEventsClient } from '@sdt/events'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.',
  )
}

export const supabase = createClient(
  url ?? '',
  publishableKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)

export const eventsClient = createSdtEventsClient(supabase)

export function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('relation') &&
    (lower.includes('does not exist') || lower.includes('not found'))
  )
}

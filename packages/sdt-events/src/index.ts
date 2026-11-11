import {
  createClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

export type SdtEvent = {
  id: string
  occurred_at: string
  type: string
  source: string
  subject_id: string | null
  correlation_id: string | null
  payload: Record<string, unknown>
  schema_version: number
}

export type EmitInput = {
  type: string
  source: string
  payload?: Record<string, unknown>
  subjectId?: string
  correlationId?: string
}

export type ListOptions = {
  type?: string
  source?: string
  correlationId?: string
  limit?: number
}

export type SdtEventsClientOptions = {
  url: string
  publishableKey: string
}

export type SdtEventsClient = {
  emit: (input: EmitInput) => Promise<SdtEvent>
  list: (options?: ListOptions) => Promise<SdtEvent[]>
  getSupabase: () => SupabaseClient
}

function wrapSupabase(supabase: SupabaseClient): SdtEventsClient {
  return {
    getSupabase: () => supabase,

    async emit(input: EmitInput): Promise<SdtEvent> {
      const { data, error } = await supabase
        .from('sdt_event_log')
        .insert({
          type: input.type,
          source: input.source,
          payload: input.payload ?? {},
          subject_id: input.subjectId ?? null,
          correlation_id: input.correlationId ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as SdtEvent
    },

    async list(options: ListOptions = {}): Promise<SdtEvent[]> {
      const limit = options.limit ?? 100
      let query = supabase
        .from('sdt_event_log')
        .select()
        .order('occurred_at', { ascending: false })
        .limit(limit)

      if (options.type) query = query.eq('type', options.type)
      if (options.source) query = query.eq('source', options.source)
      if (options.correlationId) {
        query = query.eq('correlation_id', options.correlationId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as SdtEvent[]
    },
  }
}

export function createSdtEventsClient(
  options: SdtEventsClientOptions | SupabaseClient,
): SdtEventsClient {
  if ('from' in options) {
    return wrapSupabase(options)
  }

  const supabase = createClient(options.url, options.publishableKey)
  return wrapSupabase(supabase)
}

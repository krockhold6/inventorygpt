<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SdtEvent } from '@sdt/events'
import { eventsClient, isMissingTableError } from '@/lib/supabase'

const events = ref<SdtEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const tableMissing = ref(false)

function payloadPreview(payload: Record<string, unknown>): string {
  try {
    const text = JSON.stringify(payload)
    return text.length > 80 ? `${text.slice(0, 77)}…` : text
  } catch {
    return '—'
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

async function loadEvents() {
  loading.value = true
  error.value = null
  tableMissing.value = false

  try {
    events.value = await eventsClient.list({ limit: 100 })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (isMissingTableError(message)) {
      tableMissing.value = true
      error.value =
        'Table public.sdt_event_log was not found. Run supabase db push after linking the Delivery project.'
    } else {
      error.value = message
    }
    events.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadEvents()
})
</script>

<template>
  <section class="card">
    <div class="toolbar">
      <h2>Recent events</h2>
      <button
        type="button"
        class="btn btn--primary"
        :disabled="loading"
        @click="loadEvents"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="tableMissing" class="alert alert--info">
      Apply the migration in
      <code>supabase/migrations/20261111190000_sdt_event_log.sql</code>
      with
      <code>supabase link --project-ref gyjkqbvvetxhvgisrvlc && supabase db push</code>.
    </p>

    <p v-else-if="error" class="alert alert--error" role="alert">{{ error }}</p>

    <p v-if="!error && !loading && events.length === 0" class="alert alert--info">
      No events yet. Emit a test event from the Emit tab.
    </p>

    <div v-else class="events-table-wrap">
      <table class="events-table">
        <thead>
          <tr>
            <th>Occurred at</th>
            <th>Type</th>
            <th>Source</th>
            <th>Subject ID</th>
            <th>Correlation ID</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in events" :key="row.id">
            <td>{{ formatTime(row.occurred_at) }}</td>
            <td>{{ row.type }}</td>
            <td>{{ row.source }}</td>
            <td>{{ row.subject_id ?? '—' }}</td>
            <td>
              <span class="payload-preview">{{
                row.correlation_id ?? '—'
              }}</span>
            </td>
            <td>
              <span
                class="payload-preview"
                :title="JSON.stringify(row.payload)"
              >
                {{ payloadPreview(row.payload) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

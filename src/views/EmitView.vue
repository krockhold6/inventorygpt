<script setup lang="ts">
import { ref } from 'vue'
import { eventsClient, isMissingTableError } from '@/lib/supabase'

const type = ref('sdt.test.ping')
const source = ref('sdt-events-ui')
const payloadText = ref('{\n  "message": "hello"\n}')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const tableMissing = ref(false)

async function onSubmit() {
  error.value = null
  success.value = null
  tableMissing.value = false

  let payload: Record<string, unknown> = {}
  const trimmed = payloadText.value.trim()
  if (trimmed) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        error.value = 'Payload must be a JSON object.'
        return
      }
      payload = parsed as Record<string, unknown>
    } catch {
      error.value = 'Payload is not valid JSON.'
      return
    }
  }

  if (!type.value.trim() || !source.value.trim()) {
    error.value = 'Type and source are required.'
    return
  }

  loading.value = true
  try {
    const event = await eventsClient.emit({
      type: type.value.trim(),
      source: source.value.trim(),
      payload,
    })
    success.value = `Emitted event ${event.id}`
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (isMissingTableError(message)) {
      tableMissing.value = true
      error.value =
        'Table public.sdt_event_log was not found. Apply migrations before emitting.'
    } else {
      error.value = message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="card">
    <h2 style="margin: 0 0 1rem; font-size: 1.125rem; font-weight: 600">
      Emit test event
    </h2>

    <p v-if="tableMissing" class="alert alert--info">
      The event log table is not available on this project yet. Push migrations
      from this repo first.
    </p>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <p v-if="success" class="alert alert--info">{{ success }}</p>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label for="type">Type</label>
        <input id="type" v-model="type" type="text" required />
      </div>
      <div class="field">
        <label for="source">Source</label>
        <input id="source" v-model="source" type="text" required />
      </div>
      <div class="field">
        <label for="payload">Payload (JSON object)</label>
        <textarea id="payload" v-model="payloadText" spellcheck="false" />
      </div>
      <button type="submit" class="btn btn--primary" :disabled="loading">
        {{ loading ? 'Emitting…' : 'Emit event' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  error.value = null
  loading.value = true

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  })

  loading.value = false

  if (authError) {
    error.value = authError.message
    return
  }

  const redirect =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.push(redirect)
}
</script>

<template>
  <div class="login-page">
    <div class="card login-card">
      <h1>SDT Delivery — Events</h1>
      <p>Sign in to view and emit events on the Delivery Supabase project.</p>

      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
          />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <button type="submit" class="btn btn--primary" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

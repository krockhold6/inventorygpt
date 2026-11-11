<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const session = ref<Session | null>(null)

const showChrome = computed(() => route.name !== 'login')

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_event, next) => {
    session.value = next
    if (!next && route.name !== 'login') {
      router.push({ name: 'login' })
    }
  })
})

async function signOut() {
  await supabase.auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div v-if="showChrome" class="app-shell">
    <header class="app-header">
      <div class="app-header__brand">SDT Delivery — Events</div>
      <nav>
        <RouterLink to="/">Activity</RouterLink>
        <RouterLink to="/emit">Emit test event</RouterLink>
        <button type="button" class="btn btn--ghost" @click="signOut">
          Sign out
        </button>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
</template>

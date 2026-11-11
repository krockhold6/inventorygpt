import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'events',
      component: () => import('@/views/EventsView.vue'),
    },
    {
      path: '/emit',
      name: 'emit',
      component: () => import('@/views/EmitView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ApiError, getSession, type Session } from './api/client';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';

const session = ref<Session | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    session.value = await getSession();
  } catch (e) {
    if (!(e instanceof ApiError)) {
      console.error(e);
    }
    session.value = null;
  } finally {
    loading.value = false;
  }
});

function onLoggedIn(s: Session) {
  session.value = s;
}

function onLogout() {
  session.value = null;
}
</script>

<template>
  <div v-if="loading" class="app-loading">Загрузка…</div>
  <LoginView v-else-if="!session" @logged-in="onLoggedIn" />
  <DashboardView v-else :session="session" @logout="onLogout" />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref } from 'vue';
import { getActiveUsers, logout, type Session } from '../api/client';
import ContentTab from '../components/tabs/ContentTab.vue';
import MenusTab from '../components/tabs/MenusTab.vue';
import AdminsTab from '../components/tabs/AdminsTab.vue';

const props = defineProps<{
  session: Session;
}>();

const emit = defineEmits<{
  logout: [];
}>();

type TabId = 'content' | 'menus' | 'admins';

const activeTab = ref<TabId>('content');
const activeUsers = ref<number | null>(null);
const toastMsg = ref('');
const toastVisible = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;

const isSuperAdmin = computed(() => props.session.role === 'superAdmin');

const roleLabel = computed(() =>
  props.session.role === 'superAdmin' ? '⭐ SuperAdmin' : '👤 Admin',
);

provide('showToast', (msg: string) => showToast(msg));

function showToast(msg: string) {
  toastMsg.value = msg;
  toastVisible.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2500);
}

async function fetchActiveUsers() {
  try {
    const data = await getActiveUsers();
    activeUsers.value = data.count;
  } catch {
    activeUsers.value = null;
  }
}

async function onLogout() {
  try {
    await logout();
  } catch {
    /* session may already be gone */
  }
  emit('logout');
}

onMounted(() => {
  void fetchActiveUsers();
  pollTimer = setInterval(() => void fetchActiveUsers(), 30_000);
});

onUnmounted(() => {
  clearInterval(pollTimer);
  clearTimeout(toastTimer);
});
</script>

<template>
  <div class="dashboard-body">
    <header class="topbar">
      <div class="topbar-title">Панель управления РГЭУ</div>
      <span v-if="activeUsers !== null" class="active-users">
        Онлайн: <strong>{{ activeUsers }}</strong>
      </span>
      <span class="role-badge" :class="session.role">{{ roleLabel }}</span>
      <button type="button" class="logout-btn" @click="onLogout">Выйти</button>
    </header>

    <nav class="tabs">
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'content' }"
        @click="activeTab = 'content'"
      >
        <span class="tab-icon">📝</span>Контент
      </button>
      <button
        v-if="isSuperAdmin"
        type="button"
        class="tab"
        :class="{ active: activeTab === 'menus' }"
        @click="activeTab = 'menus'"
      >
        <span class="tab-icon">🔘</span>Меню бота
      </button>
      <button
        v-if="isSuperAdmin"
        type="button"
        class="tab"
        :class="{ active: activeTab === 'admins' }"
        @click="activeTab = 'admins'"
      >
        <span class="tab-icon">👥</span>Администраторы
      </button>
    </nav>

    <ContentTab v-show="activeTab === 'content'" />
    <MenusTab v-if="isSuperAdmin" v-show="activeTab === 'menus'" />
    <AdminsTab
      v-if="isSuperAdmin"
      v-show="activeTab === 'admins'"
      :session="session"
    />

    <div class="toast" :class="{ show: toastVisible }">{{ toastMsg }}</div>
  </div>
</template>

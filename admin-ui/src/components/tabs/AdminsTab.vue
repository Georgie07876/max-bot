<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import {
  changePassword,
  createAdmin,
  deleteAdmin,
  getAdmins,
  type AdminRecord,
  type Session,
} from '../../api/client';

const props = defineProps<{
  session: Session;
}>();

const showToast = inject<(msg: string) => void>('showToast', () => {});

const admins = ref<AdminRecord[]>([]);
const loading = ref(true);
const newUsername = ref('');
const newPassword = ref('');

async function loadAdmins() {
  loading.value = true;
  try {
    admins.value = await getAdmins();
  } catch {
    showToast('Ошибка загрузки администраторов');
  } finally {
    loading.value = false;
  }
}

async function addAdmin() {
  const username = newUsername.value.trim();
  const password = newPassword.value;
  if (!username || !password) {
    showToast('Заполните имя и пароль');
    return;
  }
  if (password.length < 6) {
    showToast('Пароль минимум 6 символов');
    return;
  }
  try {
    await createAdmin({ username, password });
    showToast('Администратор создан');
    newUsername.value = '';
    newPassword.value = '';
    await loadAdmins();
  } catch {
    showToast('Ошибка создания');
  }
}

async function removeAdmin(id: string, name: string) {
  if (!confirm(`Удалить администратора "${name}"?`)) return;
  try {
    await deleteAdmin(id);
    showToast('Удалено');
    await loadAdmins();
  } catch {
    showToast('Ошибка удаления');
  }
}

async function changePass(id: string, name: string) {
  const newPass = prompt(`Новый пароль для "${name}":`);
  if (newPass === null) return;
  if (newPass.length < 6) {
    showToast('Пароль минимум 6 символов');
    return;
  }
  try {
    await changePassword(id, newPass);
    showToast('Пароль изменён');
  } catch {
    showToast('Ошибка смены пароля');
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU');
}

onMounted(() => {
  void loadAdmins();
});
</script>

<template>
  <div class="tab-pane panel">
    <section class="panel-section">
      <header class="panel-section-header">SuperAdmin</header>
      <div class="panel-section-body">
        <div class="admin-row">
          <span class="admin-role-badge super">⭐ superAdmin</span>
          <span class="admin-row-name">
            {{ session.role === 'superAdmin' ? session.username : '***' }}
          </span>
          <span class="admin-row-date">(из .env)</span>
        </div>
      </div>
    </section>

    <section class="panel-section">
      <header class="panel-section-header">
        Администраторы
        <span class="panel-section-hint">{{ admins.length }} чел.</span>
      </header>
      <div class="panel-section-body">
        <p v-if="loading" style="color: #aaa">Загрузка…</p>
        <p v-else-if="admins.length === 0" style="color: #aaa; font-size: 13px">
          Пока нет ни одного администратора
        </p>
        <div v-for="u in admins" :key="u.id" class="admin-row">
          <span class="admin-role-badge">admin</span>
          <span class="admin-row-name">{{ u.username }}</span>
          <span class="admin-row-date">{{ formatDate(u.createdAt) }}</span>
          <button
            type="button"
            class="btn-secondary"
            style="font-size: 12px; padding: 4px 10px"
            @click="changePass(u.id, u.username)"
          >
            Пароль
          </button>
          <button type="button" class="btn-danger" @click="removeAdmin(u.id, u.username)">
            Удалить
          </button>
        </div>
      </div>
    </section>

    <section class="panel-section">
      <header class="panel-section-header">Добавить администратора</header>
      <div class="panel-section-body">
        <div class="form-row">
          <div class="form-group">
            <div class="form-label">Имя пользователя</div>
            <input
              v-model="newUsername"
              class="form-input"
              placeholder="Имя без пробелов"
            />
          </div>
          <div class="form-group">
            <div class="form-label">Пароль</div>
            <input
              v-model="newPassword"
              class="form-input"
              type="password"
              placeholder="Минимум 6 символов"
            />
          </div>
          <button
            type="button"
            class="btn-primary"
            style="flex: 0; align-self: flex-end"
            @click="addAdmin"
          >
            + Добавить
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

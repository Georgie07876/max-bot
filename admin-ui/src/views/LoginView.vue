<script setup lang="ts">
import { ref } from 'vue';
import { ApiError, getSession, login } from '../api/client';
import type { Session } from '../api/client';

const emit = defineEmits<{
  loggedIn: [session: Session];
}>();

const username = ref('');
const password = ref('');
const error = ref(false);
const loading = ref(false);

async function onSubmit() {
  error.value = false;
  loading.value = true;
  try {
    const result = await login(username.value.trim(), password.value);
    if (!result.ok) {
      error.value = true;
      password.value = '';
      return;
    }
    const session = await getSession();
    emit('loggedIn', session);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = true;
      password.value = '';
    } else {
      error.value = true;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Панель управления</h1>
      <div class="login-sub">Бот РГЭУ (РИНХ)</div>
      <div v-if="error" class="login-error">Неверный логин или пароль</div>
      <form @submit.prevent="onSubmit">
        <label class="form-label">Имя пользователя</label>
        <input
          v-model="username"
          class="form-input"
          type="text"
          placeholder="Введите логин"
          autocomplete="username"
          autofocus
          style="margin-bottom: 14px"
        />
        <label class="form-label">Пароль</label>
        <input
          v-model="password"
          class="form-input"
          type="password"
          placeholder="Введите пароль"
          autocomplete="current-password"
          style="margin-bottom: 20px"
        />
        <button class="btn-primary" type="submit" style="width: 100%" :disabled="loading">
          {{ loading ? 'Вход…' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

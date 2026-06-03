<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import {
  addButton,
  createMenu,
  deleteButton,
  deleteMenu,
  getMenus,
  moveButton,
  updateButton,
  updateMenuText,
  type MenuButton,
  type MenuMap,
} from '../../api/client';

const showToast = inject<(msg: string) => void>('showToast', () => {});

const menus = ref<MenuMap>({});
const loading = ref(true);
const expanded = ref<Record<string, boolean>>({});

const newMenuId = ref('');
const newMenuText = ref('');
const newMenuParent = ref('');

const menuIds = computed(() => Object.keys(menus.value));

async function loadMenus() {
  loading.value = true;
  try {
    menus.value = await getMenus();
  } catch {
    showToast('Ошибка загрузки меню');
  } finally {
    loading.value = false;
  }
}

function toggleMenu(id: string) {
  expanded.value[id] = !expanded.value[id];
}

const drafts = ref<Record<string, string>>({});

function getDraft(id: string): string {
  return drafts.value[id] ?? menus.value[id]?.text ?? '';
}

function setDraft(id: string, text: string) {
  drafts.value[id] = text;
}

async function addMenu() {
  const id = newMenuId.value.trim();
  const text = newMenuText.value.trim();
  const parent = newMenuParent.value || null;
  if (!id || !text) {
    showToast('Заполните ID и текст');
    return;
  }
  try {
    await createMenu({ id, text, parent });
    showToast('Меню создано');
    newMenuId.value = '';
    newMenuText.value = '';
    newMenuParent.value = '';
    await loadMenus();
  } catch (e: unknown) {
    const msg =
      e && typeof e === 'object' && 'body' in e
        ? String((e as { body?: { message?: string } }).body)
        : 'Ошибка создания';
    showToast(msg);
  }
}

async function removeMenu(menuId: string) {
  if (!confirm(`Удалить меню "${menuId}"?`)) return;
  try {
    await deleteMenu(menuId);
    showToast('Удалено');
    await loadMenus();
  } catch {
    showToast('Ошибка удаления');
  }
}

async function saveMenuText(menuId: string) {
  const text = getDraft(menuId);
  try {
    await updateMenuText(menuId, text);
    menus.value[menuId].text = text;
    showToast('Текст меню сохранён');
  } catch {
    showToast('Ошибка сохранения');
  }
}

const newBtn = ref<
  Record<string, { label: string; type: 'callback' | 'url'; value: string }>
>({});

function getNewBtn(menuId: string) {
  if (!newBtn.value[menuId]) {
    newBtn.value[menuId] = { label: '', type: 'callback', value: '' };
  }
  return newBtn.value[menuId];
}

async function addBtn(menuId: string) {
  const b = getNewBtn(menuId);
  if (!b.label.trim() || !b.value.trim()) {
    showToast('Заполните текст и значение кнопки');
    return;
  }
  try {
    await addButton(menuId, {
      label: b.label.trim(),
      type: b.type,
      value: b.value.trim(),
    });
    showToast('Кнопка добавлена');
    newBtn.value[menuId] = { label: '', type: 'callback', value: '' };
    await loadMenus();
  } catch {
    showToast('Ошибка добавления');
  }
}

async function removeBtn(menuId: string, btnId: string) {
  if (!confirm('Удалить кнопку?')) return;
  try {
    await deleteButton(menuId, btnId);
    showToast('Кнопка удалена');
    await loadMenus();
  } catch {
    showToast('Ошибка удаления');
  }
}

async function moveBtn(menuId: string, btnId: string, direction: 'up' | 'down') {
  try {
    await moveButton(menuId, btnId, direction);
    await loadMenus();
  } catch {
    showToast('Ошибка перемещения');
  }
}

async function editBtn(menuId: string, btn: MenuButton) {
  const newLabel = prompt('Текст кнопки:', btn.label);
  if (newLabel === null) return;
  const newValue = prompt('Значение (ID меню или URL):', btn.value);
  if (newValue === null) return;
  try {
    await updateButton(menuId, btn.id, {
      label: newLabel,
      type: btn.type,
      value: newValue,
    });
    showToast('Кнопка обновлена');
    await loadMenus();
  } catch {
    showToast('Ошибка обновления');
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

onMounted(() => {
  void loadMenus();
});
</script>

<template>
  <div class="tab-pane panel">
    <section class="panel-section">
      <header class="panel-section-header">
        Структура меню бота
        <span class="panel-section-hint">Кликните на меню для редактирования</span>
      </header>
      <div class="panel-section-body">
        <p v-if="loading" style="color: #aaa">Загрузка…</p>
        <div v-else class="menu-tree">
          <div
            v-for="(menu, menuId) in menus"
            :key="menuId"
            class="menu-tree-item"
          >
            <div class="menu-tree-header" @click="toggleMenu(menuId)">
              <span class="menu-id">{{ menuId }}</span>
              <span class="menu-preview">{{ truncate(menu.text, 50) }}</span>
              <span v-if="menu.parent" class="menu-parent">← {{ menu.parent }}</span>
              <button
                type="button"
                class="btn-danger"
                style="margin-left: 8px"
                @click.stop="removeMenu(menuId)"
              >
                ✕
              </button>
            </div>
            <div class="menu-tree-body" :class="{ open: expanded[menuId] }">
              <div style="margin-bottom: 8px">
                <div class="form-label" style="margin-bottom: 4px">Текст над кнопками</div>
                <div style="display: flex; gap: 8px">
                  <input
                    class="form-input"
                    style="flex: 1"
                    :value="getDraft(menuId)"
                    @input="setDraft(menuId, ($event.target as HTMLInputElement).value)"
                  />
                  <button
                    type="button"
                    class="btn-primary"
                    style="flex: 0"
                    @click="saveMenuText(menuId)"
                  >
                    Сохранить
                  </button>
                </div>
              </div>

              <div class="pane-label">Кнопки ({{ menu.buttons.length }})</div>
              <div class="btn-list">
                <div
                  v-for="btn in menu.buttons"
                  :key="btn.id"
                  class="btn-row"
                >
                  <span class="btn-row-label">{{ btn.label }}</span>
                  <span class="btn-row-type" :class="btn.type">{{ btn.type }}</span>
                  <span class="btn-row-value">{{ truncate(btn.value, 20) }}</span>
                  <button
                    type="button"
                    class="btn-move"
                    title="Вверх"
                    @click="moveBtn(menuId, btn.id, 'up')"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="btn-move"
                    title="Вниз"
                    @click="moveBtn(menuId, btn.id, 'down')"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="btn-move"
                    @click="editBtn(menuId, btn)"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="btn-danger"
                    @click="removeBtn(menuId, btn.id)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="form-row" style="margin-top: 10px">
                <div class="form-group">
                  <div class="form-label">Текст кнопки</div>
                  <input
                    v-model="getNewBtn(menuId).label"
                    class="form-input"
                    placeholder="🏫 Название раздела"
                  />
                </div>
                <div class="form-group shrink">
                  <div class="form-label">Тип</div>
                  <select v-model="getNewBtn(menuId).type" class="form-select">
                    <option value="callback">callback</option>
                    <option value="url">url</option>
                  </select>
                </div>
                <div class="form-group">
                  <div class="form-label">Значение (ID меню или URL)</div>
                  <input
                    v-model="getNewBtn(menuId).value"
                    class="form-input"
                    placeholder="menu_id или https://…"
                  />
                </div>
                <button
                  type="button"
                  class="btn-primary"
                  style="flex: 0; align-self: flex-end"
                  @click="addBtn(menuId)"
                >
                  + Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-section">
      <header class="panel-section-header">Добавить новое меню</header>
      <div class="panel-section-body">
        <div class="form-row">
          <div class="form-group">
            <div class="form-label">ID меню (уникальный, латиница)</div>
            <input
              v-model="newMenuId"
              class="form-input"
              placeholder="например: my_custom_menu"
            />
          </div>
          <div class="form-group">
            <div class="form-label">Текст над кнопками</div>
            <input
              v-model="newMenuText"
              class="form-input"
              placeholder="Выберите раздел:"
            />
          </div>
          <div class="form-group shrink">
            <div class="form-label">Родитель</div>
            <select v-model="newMenuParent" class="form-select">
              <option value="">нет</option>
              <option v-for="id in menuIds" :key="id" :value="id">{{ id }}</option>
            </select>
          </div>
          <button
            type="button"
            class="btn-primary"
            style="flex: 0; align-self: flex-end"
            @click="addMenu"
          >
            + Создать
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

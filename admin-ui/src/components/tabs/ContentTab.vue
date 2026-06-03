<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  ApiError,
  getContent,
  getMenus,
  updateButton,
  updateContent,
  type MenuMap,
} from '../../api/client';
import { ACCORDION } from '../../data/accordion';
import AccordionNav from '../AccordionNav.vue';

const showToast = inject<(msg: string) => void>('showToast', () => {});

interface UrlButtonEntry {
  key: string;
  label: string;
  url: string;
  menuId: string;
  btnId: string;
  menuLabel: string;
}

const URL_GROUP = '🔗 URL-кнопки';

const content = ref<Record<string, string>>({});
const menus = ref<MenuMap>({});
const search = ref('');
const statusText = ref('Загрузка…');
const statusType = ref<'ok' | 'warn' | 'error'>('ok');

const currentKey = ref<string | null>(null);
const currentLabel = ref('');
const editorValue = ref('');
const urlValue = ref('');
const modifiedText = ref<Record<string, boolean>>({});
const modifiedUrls = ref<Record<string, boolean>>({});
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');

const openGroups = ref(new Set<string>());
const openSubs = ref(new Set<string>());
const openSubSubs = ref(new Set<string>());
const urlOpenGroups = ref(new Set<string>());
const urlOpenSubs = ref(new Set<string>());

const urlButtons = computed(() => buildUrlButtons(menus.value));

const modifiedKeys = computed(
  () => new Set(Object.keys(modifiedText.value).filter((k) => modifiedText.value[k])),
);

const isUrlKey = computed(
  () => currentKey.value !== null && currentKey.value.startsWith('url::'),
);

const currentUrlData = computed(() =>
  currentKey.value ? urlButtons.value[currentKey.value] : undefined,
);

const canSave = computed(() => {
  if (!currentKey.value) return false;
  if (isUrlKey.value) return !!modifiedUrls.value[currentKey.value];
  return !!modifiedText.value[currentKey.value];
});

const displayKey = computed(() => {
  if (!currentKey.value) return '';
  if (isUrlKey.value) return currentKey.value.split('::').slice(1).join(' / ');
  return currentKey.value;
});

const accordionKey = computed(
  () =>
    `${[...openGroups.value].join('|')}|${[...openSubs.value].join('|')}|${[...openSubSubs.value].join('|')}`,
);

const urlPreviewHref = computed(() => {
  const val = urlValue.value.trim();
  if (!val) return '';
  if (val.startsWith('http')) return val;
  if (val.startsWith('vk.') || val.startsWith('t.me')) return `https://${val}`;
  return '';
});

function buildUrlButtons(allMenus: MenuMap): Record<string, UrlButtonEntry> {
  const map: Record<string, UrlButtonEntry> = {};
  const menuLabels: Record<string, string> = {
    main: '🏠 Главное меню',
    contacts: '☎️ Контакты',
    sections: '🏀 Кружки и секции',
  };
  for (const [menuId, menu] of Object.entries(allMenus)) {
    for (const btn of menu.buttons ?? []) {
      if (btn.type === 'url') {
        const key = `url::${menuId}::${btn.id}`;
        map[key] = {
          key,
          label: btn.label,
          url: btn.value,
          menuId,
          btnId: btn.id,
          menuLabel: menuLabels[menuId] ?? menuId,
        };
      }
    }
  }
  return map;
}

const urlByMenu = computed(() => {
  const byMenu: Record<string, UrlButtonEntry[]> = {};
  const q = search.value.toLowerCase();
  for (const btn of Object.values(urlButtons.value)) {
    if (q && !btn.label.toLowerCase().includes(q)) continue;
    if (!byMenu[btn.menuLabel]) byMenu[btn.menuLabel] = [];
    byMenu[btn.menuLabel].push(btn);
  }
  return byMenu;
});

function setStatus(text: string, type: 'ok' | 'warn' | 'error' = 'ok') {
  statusText.value = text;
  statusType.value = type;
}

async function loadData() {
  try {
    const [contentData, menusData] = await Promise.all([getContent(), getMenus()]);
    content.value = contentData;
    menus.value = menusData;
    setStatus(
      `Данные загружены (${Object.keys(contentData).length} записей, ${Object.keys(buildUrlButtons(menusData)).length} URL-кнопок)`,
    );
  } catch (e) {
    if (e instanceof ApiError) {
      setStatus('Ошибка загрузки контента', 'error');
    } else {
      setStatus('Ошибка подключения', 'error');
    }
  }
}

function confirmUnsaved(): boolean {
  if (!currentKey.value) return true;
  const dirty = isUrlKey.value
    ? modifiedUrls.value[currentKey.value]
    : modifiedText.value[currentKey.value];
  if (!dirty) return true;
  return confirm('Есть несохранённые изменения. Продолжить?');
}

function expandPathForKey(key: string) {
  if (key.startsWith('url::')) {
    const data = urlButtons.value[key];
    if (data) {
      urlOpenGroups.value.add(URL_GROUP);
      urlOpenSubs.value.add(`url-sub::${data.menuLabel}`);
    }
    return;
  }
  for (const group of ACCORDION) {
    if (group.items?.some((i) => i.key === key)) {
      openGroups.value.add(group.label);
    } else if (group.sub) {
      for (const sub of group.sub) {
        if (sub.items?.some((i) => i.key === key)) {
          openGroups.value.add(group.label);
          openSubs.value.add(sub.label);
        } else if (sub.sub) {
          for (const ss of sub.sub) {
            if ((ss.items ?? []).some((i) => i.key === key)) {
              openGroups.value.add(group.label);
              openSubs.value.add(sub.label);
              openSubSubs.value.add(`${sub.label}::${ss.label}`);
            }
          }
        }
      }
    }
  }
}

function selectKey(key: string, label: string) {
  if (currentKey.value === key) return;
  if (!confirmUnsaved()) return;
  expandPathForKey(key);
  currentKey.value = key;
  currentLabel.value = label;
  saveState.value = 'idle';

  if (key.startsWith('url::')) {
    const data = urlButtons.value[key];
    urlValue.value = data?.url ?? '';
  } else {
    editorValue.value = content.value[key] ?? '';
  }
}

function onEditorInput() {
  if (!currentKey.value || isUrlKey.value) return;
  modifiedText.value[currentKey.value] =
    editorValue.value !== (content.value[currentKey.value] ?? '');
}

function onUrlInput() {
  if (!currentKey.value || !isUrlKey.value) return;
  const data = urlButtons.value[currentKey.value];
  const val = urlValue.value.trim();
  modifiedUrls.value[currentKey.value] = val !== (data?.url ?? '');
}

async function save() {
  if (!currentKey.value || !canSave.value) return;
  saveState.value = 'saving';

  try {
    if (isUrlKey.value) {
      const data = currentUrlData.value;
      if (!data) return;
      const newUrl = urlValue.value.trim();
      if (!newUrl) {
        showToast('URL не может быть пустым');
        saveState.value = 'idle';
        return;
      }
      await updateButton(data.menuId, data.btnId, {
        label: data.label,
        type: 'url',
        value: newUrl,
      });
      data.url = newUrl;
      menus.value = { ...menus.value };
      delete modifiedUrls.value[currentKey.value];
      showToast('Ссылка сохранена ✓');
      setStatus(`Сохранено: ${data.label}`);
    } else {
      const key = currentKey.value;
      await updateContent(key, editorValue.value);
      content.value[key] = editorValue.value;
      delete modifiedText.value[key];
      showToast('Сохранено ✓');
      setStatus(`Сохранено: ${key}`);
    }
    saveState.value = 'saved';
    setTimeout(() => {
      saveState.value = 'idle';
    }, 2000);
  } catch {
    saveState.value = 'error';
    showToast('Ошибка сохранения!');
    setTimeout(() => {
      saveState.value = 'idle';
    }, 3000);
  }
}

function saveBtnClass(): string {
  const base = 'btn-primary';
  if (saveState.value === 'saved') return `${base} saved`;
  if (saveState.value === 'error') return `${base} error-state`;
  return base;
}

function saveBtnLabel(): string {
  if (saveState.value === 'saving') return 'Сохраняю…';
  if (saveState.value === 'saved') return 'Сохранено ✓';
  if (saveState.value === 'error') return 'Ошибка ✗';
  return 'Сохранить';
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (canSave.value) void save();
  }
}

onMounted(() => {
  void loadData();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});

watch(editorValue, onEditorInput);
watch(urlValue, onUrlInput);
</script>

<template>
  <div class="tab-pane content-tab">
    <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-search">
        <input
          v-model="search"
          class="search-input"
          type="search"
          placeholder="Поиск по разделам…"
        />
      </div>
      <div class="sidebar-list">
        <!-- URL buttons section -->
        <template v-if="Object.keys(urlByMenu).length > 0">
          <div
            class="acc-header"
            :class="{
              open: urlOpenGroups.has(URL_GROUP) || !!search,
            }"
            @click="
              urlOpenGroups.has(URL_GROUP)
                ? urlOpenGroups.delete(URL_GROUP)
                : urlOpenGroups.add(URL_GROUP)
            "
          >
            <span>{{ URL_GROUP }}</span>
            <span class="chevron">▶</span>
          </div>
          <div
            class="acc-body"
            :class="{ open: urlOpenGroups.has(URL_GROUP) || !!search }"
          >
            <template v-for="(btns, menuLabel) in urlByMenu" :key="menuLabel">
              <div
                class="acc-sub-header"
                :class="{
                  open:
                    urlOpenSubs.has(`url-sub::${menuLabel}`) || !!search,
                }"
                @click="
                  urlOpenSubs.has(`url-sub::${menuLabel}`)
                    ? urlOpenSubs.delete(`url-sub::${menuLabel}`)
                    : urlOpenSubs.add(`url-sub::${menuLabel}`)
                "
              >
                <span>{{ menuLabel }}</span>
                <span class="chevron">▶</span>
              </div>
              <div
                class="acc-sub-body"
                :class="{
                  open: urlOpenSubs.has(`url-sub::${menuLabel}`) || !!search,
                }"
              >
                <div
                  v-for="btn in btns"
                  :key="btn.key"
                  class="nav-item"
                  :class="{
                    active: currentKey === btn.key,
                    modified: modifiedUrls[btn.key],
                  }"
                  :title="btn.key"
                  @click="selectKey(btn.key, btn.label)"
                >
                  <span>{{ btn.label }}</span>
                  <span class="url-badge">URL</span>
                </div>
              </div>
            </template>
          </div>
        </template>

        <AccordionNav
          :key="accordionKey"
          :groups="ACCORDION"
          :content="content"
          :query="search"
          :active-key="currentKey"
          :modified-keys="modifiedKeys"
          :default-open-groups="openGroups"
          :default-open-subs="openSubs"
          :default-open-sub-subs="openSubSubs"
          @select="selectKey"
        />
      </div>
    </aside>

    <main class="main">
      <div v-if="!currentKey" class="empty-state">
        <p>Выберите раздел слева</p>
        <small>Для редактирования текста или ссылки</small>
      </div>

      <template v-else>
        <header class="main-header">
          <span class="main-key">{{ displayKey }}</span>
          <span class="main-title">{{ currentLabel }}</span>
          <div class="header-actions">
            <button
              type="button"
              :class="saveBtnClass()"
              :disabled="!canSave || saveState === 'saving'"
              @click="save"
            >
              {{ saveBtnLabel() }}
            </button>
          </div>
        </header>

        <div v-if="isUrlKey" class="url-editor-pane">
          <div>
            <span class="url-type-badge">URL</span>
          </div>
          <p class="form-label">
            Ссылка открывается при нажатии кнопки в Telegram. Изменения сохраняются в
            меню бота.
          </p>
          <div class="form-group">
            <label class="form-label">URL</label>
            <input v-model="urlValue" class="url-input" type="text" />
          </div>
          <a
            v-if="urlPreviewHref"
            class="url-preview-link"
            :href="urlPreviewHref"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ urlPreviewHref }}
          </a>
        </div>

        <div v-else class="editor-pane">
          <span class="pane-label">Текст сообщения</span>
          <textarea
            v-model="editorValue"
            class="editor-textarea"
            spellcheck="false"
          />
          <span class="form-label">{{ editorValue.length }} симв.</span>
        </div>
      </template>
    </main>
    </div>

    <footer class="statusbar">
      <span class="status-dot" :class="statusType === 'error' ? 'error' : statusType === 'warn' ? 'warn' : ''" />
      <span class="status-text">{{ statusText }}</span>
    </footer>
  </div>
</template>

<style scoped>
.content-tab {
  flex-direction: column;
}
</style>

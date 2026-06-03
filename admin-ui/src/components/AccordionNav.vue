<script setup lang="ts">
import { ref } from 'vue';
import type { AccordionGroup, AccordionItem, AccordionSub } from '../data/accordion';

const props = defineProps<{
  groups: AccordionGroup[];
  content: Record<string, string>;
  query: string;
  activeKey: string | null;
  modifiedKeys: Set<string>;
  defaultOpenGroups?: Set<string>;
  defaultOpenSubs?: Set<string>;
  defaultOpenSubSubs?: Set<string>;
}>();

const emit = defineEmits<{
  select: [key: string, label: string];
}>();

const openGroups = ref(new Set(props.defaultOpenGroups ?? []));
const openSubs = ref(new Set(props.defaultOpenSubs ?? []));
const openSubSubs = ref(new Set(props.defaultOpenSubSubs ?? []));

function matches(label: string, key: string): boolean {
  if (!props.query) return true;
  const q = props.query.toLowerCase();
  return label.toLowerCase().includes(q) || key.toLowerCase().includes(q);
}

function allLeafKeys(node: AccordionGroup | AccordionSub): string[] {
  if ('items' in node && node.items) return node.items.map((i) => i.key);
  if ('sub' in node && node.sub) return node.sub.flatMap(allLeafKeys);
  return [];
}

function itemsInSub(sub: AccordionSub): AccordionItem[] {
  if (sub.items) return sub.items;
  if (sub.sub) return sub.sub.flatMap((s) => s.items ?? []);
  return [];
}

function groupVisible(group: AccordionGroup): boolean {
  if (!props.query) return true;
  return allLeafKeys(group).some((k) => {
    const item = findItemInGroup(group, k);
    return item && matches(item.label, k) && props.content[k];
  });
}

function findItemInGroup(group: AccordionGroup, key: string): AccordionItem | undefined {
  if (group.items) return group.items.find((i) => i.key === key);
  if (group.sub) {
    for (const sub of group.sub) {
      const found = itemsInSub(sub).find((i) => i.key === key);
      if (found) return found;
    }
  }
  return undefined;
}

function subVisible(sub: AccordionSub): boolean {
  if (!props.query) return true;
  return allLeafKeys(sub).some((k) => {
    const item = itemsInSub(sub).find((i) => i.key === k);
    return item && matches(item.label, k) && props.content[k];
  });
}

function toggleGroup(label: string) {
  if (openGroups.value.has(label)) openGroups.value.delete(label);
  else openGroups.value.add(label);
}

function toggleSub(label: string) {
  if (openSubs.value.has(label)) openSubs.value.delete(label);
  else openSubs.value.add(label);
}

function toggleSubSub(key: string) {
  if (openSubSubs.value.has(key)) openSubSubs.value.delete(key);
  else openSubSubs.value.add(key);
}

function isGroupOpen(label: string, group: AccordionGroup): boolean {
  return openGroups.value.has(label) || (!!props.query && groupVisible(group));
}

function isSubOpen(label: string, sub: AccordionSub): boolean {
  return openSubs.value.has(label) || (!!props.query && subVisible(sub));
}

function isSubSubOpen(key: string, ss: AccordionSub): boolean {
  const ssMatch = (ss.items ?? []).some(
    (i) => matches(i.label, i.key) && props.content[i.key],
  );
  return openSubSubs.value.has(key) || (!!props.query && ssMatch);
}

function onSelect(item: AccordionItem) {
  emit('select', item.key, item.label);
}

function navClass(key: string, level?: 'l1' | 'l3'): Record<string, boolean> {
  return {
    'nav-item': true,
    l1: level === 'l1',
    l3: level === 'l3',
    active: props.activeKey === key,
    modified: props.modifiedKeys.has(key),
  };
}
</script>

<template>
  <div v-for="group in groups" :key="group.label">
    <template v-if="groupVisible(group)">
      <div
        class="acc-header"
        :class="{ open: isGroupOpen(group.label, group) }"
        @click="toggleGroup(group.label)"
      >
        <span>{{ group.label }}</span>
        <span class="chevron">▶</span>
      </div>
      <div class="acc-body" :class="{ open: isGroupOpen(group.label, group) }">
        <template v-if="group.items">
          <div
            v-for="item in group.items"
            :key="item.key"
            v-show="content[item.key] && (!query || matches(item.label, item.key))"
            :class="navClass(item.key, 'l1')"
            :title="item.key"
            @click="onSelect(item)"
          >
            {{ item.label }}
          </div>
        </template>

        <template v-else-if="group.sub">
          <template v-for="sub in group.sub" :key="sub.label">
            <template v-if="subVisible(sub)">
              <div
                class="acc-sub-header"
                :class="{ open: isSubOpen(sub.label, sub) }"
                @click="toggleSub(sub.label)"
              >
                <span>{{ sub.label }}</span>
                <span class="chevron">▶</span>
              </div>
              <div class="acc-sub-body" :class="{ open: isSubOpen(sub.label, sub) }">
                <template v-if="sub.items">
                  <div
                    v-for="item in sub.items"
                    :key="item.key"
                    v-show="content[item.key] && (!query || matches(item.label, item.key))"
                    :class="navClass(item.key)"
                    :title="item.key"
                    @click="onSelect(item)"
                  >
                    {{ item.label }}
                  </div>
                </template>

                <template v-else-if="sub.sub">
                  <template v-for="ss in sub.sub" :key="ss.label">
                    <template
                      v-if="
                        !query ||
                        (ss.items ?? []).some(
                          (i) => matches(i.label, i.key) && content[i.key],
                        )
                      "
                    >
                      <div
                        class="acc-sub-sub-header"
                        :class="{
                          open: isSubSubOpen(`${sub.label}::${ss.label}`, ss),
                        }"
                        @click="toggleSubSub(`${sub.label}::${ss.label}`)"
                      >
                        <span>{{ ss.label }}</span>
                        <span class="chevron">▶</span>
                      </div>
                      <div
                        class="acc-sub-sub-body"
                        :class="{
                          open: isSubSubOpen(`${sub.label}::${ss.label}`, ss),
                        }"
                      >
                        <div
                          v-for="item in ss.items ?? []"
                          :key="item.key"
                          v-show="
                            content[item.key] &&
                            (!query || matches(item.label, item.key))
                          "
                          :class="navClass(item.key, 'l3')"
                          :title="item.key"
                          @click="onSelect(item)"
                        >
                          {{ item.label }}
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </div>
            </template>
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

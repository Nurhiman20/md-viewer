<script setup lang="ts">
import { computed } from "vue";
import AppIcon from "./AppIcon.vue";
import { usePreferences, ZOOM_MAX, ZOOM_MIN } from "../composables/usePreferences";
import { basename, dirname } from "../lib/path";

const props = defineProps<{ path: string | null; canReload: boolean }>();
defineEmits<{ open: []; reload: [] }>();

const { theme, zoom, cycleTheme, zoomIn, zoomOut, resetZoom } = usePreferences();

const themeLabel = computed(
  () => ({ system: "Tema: ikuti sistem", light: "Tema: terang", dark: "Tema: gelap" })[theme.value],
);
const themeIcon = computed(() => (({ system: "monitor", light: "sun", dark: "moon" }) as const)[theme.value]);
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-(--border) bg-(--bg)/90 px-3 backdrop-blur"
  >
    <button type="button" class="btn" title="Buka file (Ctrl+O)" @click="$emit('open')">
      <AppIcon name="folder" />
      <span class="hidden sm:inline">Buka</span>
    </button>

    <div class="min-w-0 flex-1 px-1" :title="props.path ?? undefined">
      <template v-if="props.path">
        <h1 class="truncate text-sm font-semibold">{{ basename(props.path) }}</h1>
        <p class="hidden truncate text-xs text-(--muted) sm:block">{{ dirname(props.path) }}</p>
      </template>
    </div>

    <button
      type="button"
      class="btn-icon"
      :disabled="!canReload"
      aria-label="Muat ulang (F5)"
      title="Muat ulang (F5)"
      @click="$emit('reload')"
    >
      <AppIcon name="reload" />
    </button>

    <div class="flex items-center" role="group" aria-label="Zoom">
      <button
        type="button"
        class="btn-icon"
        :disabled="zoom <= ZOOM_MIN"
        aria-label="Perkecil (Ctrl+-)"
        title="Perkecil (Ctrl+-)"
        @click="zoomOut"
      >
        <AppIcon name="minus" />
      </button>
      <button
        type="button"
        class="h-8 w-12 rounded-md text-xs tabular-nums text-(--muted) hover:bg-(--hover) focus-visible:outline-2 focus-visible:outline-(--accent)"
        aria-label="Reset zoom (Ctrl+0)"
        title="Reset zoom (Ctrl+0)"
        @click="resetZoom"
      >
        {{ Math.round(zoom * 100) }}%
      </button>
      <button
        type="button"
        class="btn-icon"
        :disabled="zoom >= ZOOM_MAX"
        aria-label="Perbesar (Ctrl+=)"
        title="Perbesar (Ctrl+=)"
        @click="zoomIn"
      >
        <AppIcon name="plus" />
      </button>
    </div>

    <button type="button" class="btn-icon" :aria-label="themeLabel" :title="themeLabel" @click="cycleTheme">
      <AppIcon :name="themeIcon" />
    </button>
  </header>
</template>

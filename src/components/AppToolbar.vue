<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import AppLogo from "./AppLogo.vue";
import { usePreferences, ZOOM_MAX, ZOOM_MIN } from "../composables/usePreferences";
import { basename, dirname } from "../lib/path";

const props = defineProps<{ path: string | null; canReload: boolean }>();
defineEmits<{ open: []; reload: [] }>();

const { isDark, zoom, setDark, zoomIn, zoomOut, resetZoom } = usePreferences();
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-(--border) bg-(--bg)/90 px-3 backdrop-blur"
  >
    <AppLogo :size="26" class="shrink-0" />

    <button type="button" class="btn" title="Buka file (Ctrl+O)" @click="$emit('open')">
      <AppIcon name="folder" />
      <span class="hidden sm:inline">Buka</span>
    </button>

    <div class="min-w-0 flex-1 px-1" :title="props.path ?? undefined">
      <template v-if="props.path">
        <h1 class="truncate text-sm font-semibold">{{ basename(props.path) }}</h1>
        <p class="hidden truncate text-xs text-(--muted) sm:block">{{ dirname(props.path) }}</p>
      </template>
      <h1 v-else class="truncate text-sm font-semibold">MD Viewer</h1>
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

    <button
      type="button"
      role="switch"
      class="theme-switch"
      :aria-checked="isDark"
      aria-label="Mode gelap"
      :title="isDark ? 'Mode gelap: aktif' : 'Mode gelap: nonaktif'"
      @click="setDark(!isDark)"
    >
      <span class="theme-switch-thumb">
        <AppIcon :name="isDark ? 'moon' : 'sun'" :size="12" />
      </span>
    </button>
  </header>
</template>

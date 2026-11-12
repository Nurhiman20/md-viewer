<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import AppLogo from "./AppLogo.vue";
import { usePreferences } from "../composables/usePreferences";
import { basename, dirname } from "../lib/path";

defineEmits<{ open: []; openRecent: [path: string] }>();

const { recent, removeRecent } = usePreferences();
</script>

<template>
  <section class="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center" aria-labelledby="empty-title">
    <AppLogo :size="64" class="mb-5 drop-shadow-md" />
    <h2 id="empty-title" class="text-xl font-semibold">Buka file Markdown</h2>
    <p class="mt-2 text-sm text-(--muted)">
      Klik <strong>Buka file</strong>, tekan <kbd>Ctrl</kbd>+<kbd>O</kbd>, atau seret file
      <code>.md</code> ke jendela ini. Perubahan file akan tampil otomatis.
    </p>
    <button type="button" class="btn-primary mt-6" @click="$emit('open')">
      <AppIcon name="folder" />
      Buka file
    </button>

    <div v-if="recent.length" class="mt-12 w-full text-left">
      <h3 class="mb-2 px-1 text-xs font-semibold tracking-wide text-(--muted) uppercase">Terakhir dibuka</h3>
      <ul class="divide-y divide-(--border) overflow-hidden rounded-xl border border-(--border)">
        <li v-for="file in recent" :key="file" class="group flex items-center">
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left hover:bg-(--hover) focus-visible:bg-(--hover) focus-visible:outline-none"
            :title="file"
            @click="$emit('openRecent', file)"
          >
            <AppIcon name="file" class="shrink-0 text-(--muted)" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{{ basename(file) }}</span>
              <span class="block truncate text-xs text-(--muted)">{{ dirname(file) }}</span>
            </span>
          </button>
          <button
            type="button"
            class="btn-icon mr-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
            :aria-label="`Hapus ${basename(file)} dari daftar`"
            title="Hapus dari daftar"
            @click="removeRecent(file)"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

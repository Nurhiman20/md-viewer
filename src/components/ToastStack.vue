<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
import { useToast } from "../composables/useToast";

const { toasts, dismiss } = useToast();
const icons = { success: "check", error: "alert", info: "info" } as const;
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border border-(--border) bg-(--surface) py-2 pr-2 pl-3 text-sm shadow-lg"
        :role="t.kind === 'error' ? 'alert' : 'status'"
      >
        <AppIcon
          :name="icons[t.kind]"
          :size="16"
          :class="t.kind === 'error' ? 'text-(--danger)' : t.kind === 'success' ? 'text-(--success)' : 'text-(--accent)'"
        />
        <span class="flex-1">{{ t.message }}</span>
        <button type="button" class="btn-icon h-6 w-6" aria-label="Tutup notifikasi" @click="dismiss(t.id)">
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

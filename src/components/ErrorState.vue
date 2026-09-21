<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

defineProps<{ message: string }>();
defineEmits<{ retry: []; open: [] }>();
</script>

<template>
  <section class="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center" role="alert">
    <div class="mb-5 rounded-2xl bg-(--danger-soft) p-4 text-(--danger)">
      <AppIcon name="alert" :size="32" />
    </div>
    <h2 class="text-lg font-semibold">Dokumen tidak bisa ditampilkan</h2>
    <p class="mt-2 text-sm text-(--muted)">{{ message }}</p>
    <div class="mt-6 flex gap-2">
      <button type="button" class="btn-primary" @click="$emit('retry')">
        <AppIcon name="reload" />
        Coba lagi
      </button>
      <button type="button" class="btn" @click="$emit('open')">
        <AppIcon name="folder" />
        Buka file lain
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
// Same artwork as app-icon.svg (source of the window/installer icons).
defineProps<{ size?: number }>();
const gradientId = `mdv-logo-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <svg :width="size ?? 24" :height="size ?? 24" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4493f8" />
        <stop offset="1" stop-color="#0550ae" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="15" :fill="`url(#${gradientId})`" />
    <rect x="9" y="14" width="46" height="36" rx="6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" />
    <path
      d="M17 41V23l7.5 9 7.5-9v18M45 23v17m-6-6 6 6 6-6"
      fill="none"
      stroke="#fff"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

import { computed, watchEffect } from "vue";
import { useLocalStorage, usePreferredDark } from "@vueuse/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { samePath } from "../lib/path";

export type ThemeMode = "system" | "light" | "dark";

const MAX_RECENT = 10;
export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

// Module-level singletons: every component shares the same preference state.
// useLocalStorage falls back to in-memory values when storage is unavailable.
const theme = useLocalStorage<ThemeMode>("mdv:theme", "system");
const zoom = useLocalStorage<number>("mdv:zoom", 1);
const recent = useLocalStorage<string[]>("mdv:recent", []);
const systemDark = usePreferredDark();

const isDark = computed(() => theme.value === "dark" || (theme.value === "system" && systemDark.value));

watchEffect(() => document.documentElement.classList.toggle("dark", isDark.value));
// Keep the native title bar in sync; null = follow Windows.
watchEffect(() => {
  getCurrentWindow()
    .setTheme(theme.value === "system" ? null : theme.value)
    .catch(() => {});
});

const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10));

export function usePreferences() {
  function cycleTheme() {
    const order: ThemeMode[] = ["system", "light", "dark"];
    theme.value = order[(order.indexOf(theme.value) + 1) % order.length];
  }

  function zoomIn() {
    zoom.value = clampZoom(zoom.value + ZOOM_STEP);
  }
  function zoomOut() {
    zoom.value = clampZoom(zoom.value - ZOOM_STEP);
  }
  function resetZoom() {
    zoom.value = 1;
  }

  function addRecent(path: string) {
    recent.value = [path, ...recent.value.filter((p) => !samePath(p, path))].slice(0, MAX_RECENT);
  }
  function removeRecent(path: string) {
    recent.value = recent.value.filter((p) => !samePath(p, path));
  }

  return { theme, isDark, zoom, recent, cycleTheme, zoomIn, zoomOut, resetZoom, addRecent, removeRecent };
}

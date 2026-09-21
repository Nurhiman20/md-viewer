<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import AppToolbar from "./components/AppToolbar.vue";
import AppIcon from "./components/AppIcon.vue";
import EmptyState from "./components/EmptyState.vue";
import ErrorState from "./components/ErrorState.vue";
import MarkdownView from "./components/MarkdownView.vue";
import SkeletonDoc from "./components/SkeletonDoc.vue";
import ToastStack from "./components/ToastStack.vue";
import { useDocument } from "./composables/useDocument";
import { useFileWatcher } from "./composables/useFileWatcher";
import { usePreferences } from "./composables/usePreferences";
import { useToast } from "./composables/useToast";
import { isMarkdownPath, MARKDOWN_EXT } from "./lib/path";

const doc = useDocument();
const prefs = usePreferences();
const toast = useToast();
const dragging = ref(false);

// Survives a webview reload (F5 in dev, crash recovery) but not an app restart.
const SESSION_KEY = "mdv:current";
watch(doc.path, (path) => {
  try {
    if (path) sessionStorage.setItem(SESSION_KEY, path);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage unavailable: nothing to restore later, which is fine
  }
});

function sessionFile(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

useFileWatcher(
  doc.path,
  () => doc.reload({ silent: true }),
  () => doc.markMissing(),
);

async function openFile(path: string) {
  const ok = await doc.open(path);
  if (ok) window.scrollTo({ top: 0 });
}

async function openRecent(path: string) {
  if (await doc.open(path)) return;
  prefs.removeRecent(path);
  doc.close();
  toast.error("File tidak ditemukan, dihapus dari daftar terakhir dibuka.");
}

async function pickFile() {
  try {
    const selected = await openDialog({
      multiple: false,
      directory: false,
      filters: [{ name: "Markdown", extensions: MARKDOWN_EXT }],
    });
    if (typeof selected === "string") await openFile(selected);
  } catch (err) {
    console.error("dialog failed", err);
    toast.error("Jendela pilih file tidak bisa dibuka. Coba lagi.");
  }
}

function onKeydown(e: KeyboardEvent) {
  const ctrl = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (ctrl && key === "o") pickFile();
  else if (e.key === "F5" || (ctrl && key === "r")) doc.reload();
  else if (ctrl && (key === "=" || key === "+")) prefs.zoomIn();
  else if (ctrl && key === "-") prefs.zoomOut();
  else if (ctrl && key === "0") prefs.resetZoom();
  else return;
  // Also blocks the webview's own reload/zoom so ours is the only one.
  e.preventDefault();
}

const cleanups: UnlistenFn[] = [];

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);

  cleanups.push(await listen<string>("open-file", (e) => openFile(e.payload)));

  cleanups.push(
    await getCurrentWebview().onDragDropEvent((e) => {
      const { type } = e.payload;
      if (type === "enter" || type === "over") dragging.value = true;
      else if (type === "leave") dragging.value = false;
      else if (type === "drop") {
        dragging.value = false;
        const file = e.payload.paths.find(isMarkdownPath);
        if (file) openFile(file);
        else toast.error("Hanya file .md atau .markdown yang bisa dibuka.");
      }
    }),
  );

  const startup = (await invoke<string | null>("get_startup_file").catch(() => null)) ?? sessionFile();
  if (startup) await openFile(startup);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  cleanups.forEach((fn) => fn());
});
</script>

<template>
  <AppToolbar :path="doc.path.value" :can-reload="!!doc.path.value" @open="pickFile" @reload="doc.reload()" />

  <main class="px-4 sm:px-8">
    <SkeletonDoc v-if="doc.status.value === 'loading'" />
    <ErrorState
      v-else-if="doc.status.value === 'error'"
      :message="doc.errorMessage.value"
      @retry="doc.reload()"
      @open="pickFile"
    />
    <MarkdownView
      v-else-if="doc.status.value === 'ready' && doc.path.value"
      :html="doc.html.value"
      :path="doc.path.value"
      :is-dark="prefs.isDark.value"
      :zoom="prefs.zoom.value"
      @open-file="openFile"
    />
    <EmptyState v-else @open="pickFile" @open-recent="openRecent" />
  </main>

  <Transition name="fade">
    <div
      v-if="dragging"
      class="pointer-events-none fixed inset-2 z-40 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-(--accent) bg-(--bg)/85 text-(--accent)"
      aria-hidden="true"
    >
      <AppIcon name="upload" :size="40" />
      <p class="font-medium">Lepas untuk membuka file Markdown</p>
    </div>
  </Transition>

  <ToastStack />
</template>

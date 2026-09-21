import { ref } from "vue";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { renderMarkdown } from "../lib/markdown";
import { basename, isMarkdownPath } from "../lib/path";
import { usePreferences } from "./usePreferences";
import { useToast } from "./useToast";

export type DocStatus = "empty" | "loading" | "ready" | "error";

const path = ref<string | null>(null);
const html = ref("");
const status = ref<DocStatus>("empty");
const errorMessage = ref("");

// Increments per load so a slow read can't overwrite a newer document.
let loadToken = 0;

function friendlyError(err: unknown): string {
  const text = String(err).toLowerCase();
  if (/not found|os error 2|os error 3|cannot find|no such file/.test(text)) {
    return "File tidak ditemukan. Mungkin sudah dipindah, diganti nama, atau dihapus.";
  }
  if (/denied|not allowed|forbidden|os error 5/.test(text)) {
    return "Tidak punya izin membaca file ini.";
  }
  if (/utf-8|utf8|invalid data|stream did not contain/.test(text)) {
    return "Isi file tidak bisa dibaca sebagai teks (bukan UTF-8).";
  }
  if (/os error 32|being used by another process/.test(text)) {
    return "File sedang dipakai aplikasi lain. Coba lagi sebentar.";
  }
  return "File tidak bisa dibuka. Coba lagi.";
}

function setTitle(file: string | null) {
  getCurrentWindow()
    .setTitle(file ? `${basename(file)} — MD Viewer` : "MD Viewer")
    .catch(() => {});
}

export function useDocument() {
  const { addRecent } = usePreferences();
  const toast = useToast();

  /** Open a file. Returns false when it couldn't be loaded. */
  async function open(file: string): Promise<boolean> {
    if (!isMarkdownPath(file)) {
      toast.error("Hanya file .md atau .markdown yang bisa dibuka.");
      return false;
    }
    const token = ++loadToken;
    path.value = file;
    status.value = "loading";
    setTitle(file);
    try {
      const source = await readTextFile(file);
      if (token !== loadToken) return true;
      html.value = renderMarkdown(source);
      status.value = "ready";
      addRecent(file);
      return true;
    } catch (err) {
      if (token !== loadToken) return false;
      console.error("open failed", file, err);
      errorMessage.value = friendlyError(err);
      status.value = "error";
      return false;
    }
  }

  /** Re-read the current file in place (live reload): no skeleton, scroll stays put. */
  async function reload({ silent = false } = {}) {
    const file = path.value;
    if (!file) return;
    if (status.value !== "ready") {
      await open(file);
      return;
    }
    const token = ++loadToken;
    try {
      const source = await readTextFile(file);
      if (token !== loadToken) return;
      html.value = renderMarkdown(source);
      if (!silent) toast.success("Dokumen dimuat ulang");
    } catch (err) {
      if (token !== loadToken) return;
      console.error("reload failed", file, err);
      errorMessage.value = friendlyError(err);
      status.value = "error";
    }
  }

  function markMissing() {
    errorMessage.value = "File sudah dipindah atau dihapus. Kembalikan filenya lalu coba lagi.";
    status.value = "error";
  }

  function close() {
    loadToken++;
    path.value = null;
    html.value = "";
    status.value = "empty";
    setTitle(null);
  }

  return { path, html, status, errorMessage, open, reload, markMissing, close };
}

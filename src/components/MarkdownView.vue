<script setup lang="ts">
import { ref, watch } from "vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { dirname, isMarkdownPath, resolvePath } from "../lib/path";
import { useToast } from "../composables/useToast";

const props = defineProps<{ html: string; path: string; isDark: boolean; zoom: number }>();
const emit = defineEmits<{ openFile: [path: string] }>();

const article = ref<HTMLElement | null>(null);
const toast = useToast();

const EXTERNAL = /^(https?|mailto|tel):/i;
const INLINE_SRC = /^(https?|data|blob|asset):/i;

/** file:///C:/x.md or plain relative/absolute path → absolute local path. */
function toLocalPath(href: string): string {
  const base = dirname(props.path);
  if (/^file:/i.test(href)) return resolvePath(base, href.replace(/^file:\/*/i, ""));
  return resolvePath(base, href);
}

function fixImages(root: HTMLElement) {
  for (const img of root.querySelectorAll<HTMLImageElement>("img[src]")) {
    const src = img.getAttribute("src")!;
    if (!INLINE_SRC.test(src)) img.src = convertFileSrc(toLocalPath(src));
    img.loading = "lazy";
    img.onerror = () => img.classList.add("img-broken");
  }
}

const ICON = (d: string) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const COPY_IDLE = `${ICON("M9 9h11v11H9zM5 15H4V4h11v1")}<span>Salin</span>`;
const COPY_DONE = `${ICON("M20 6 9 17l-5-5")}<span>Tersalin</span>`;

/** Wraps every code block so it gets a language label + copy button that don't scroll away. */
function addCopyButtons(root: HTMLElement) {
  for (const pre of root.querySelectorAll<HTMLPreElement>("pre.code-block")) {
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.replaceWith(wrap);
    wrap.append(pre);

    const tools = document.createElement("div");
    tools.className = "code-tools";
    const lang = pre.dataset.lang;
    if (lang) {
      const label = document.createElement("span");
      label.className = "code-lang";
      label.textContent = lang;
      tools.append(label);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", lang ? `Salin kode ${lang}` : "Salin kode");
    btn.innerHTML = COPY_IDLE;
    tools.append(btn);
    wrap.append(tools);
  }
}

const copyTimers = new WeakMap<HTMLButtonElement, number>();
async function copyCode(btn: HTMLButtonElement) {
  const text = btn.closest(".code-wrap")?.querySelector("pre")?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(text.replace(/\n$/, ""));
  } catch (err) {
    console.error("copy failed", err);
    toast.error("Gagal menyalin. Coba lagi.");
    return;
  }
  btn.innerHTML = COPY_DONE;
  btn.classList.add("copied");
  clearTimeout(copyTimers.get(btn));
  copyTimers.set(
    btn,
    window.setTimeout(() => {
      btn.innerHTML = COPY_IDLE;
      btn.classList.remove("copied");
    }, 1800),
  );
  toast.success("Kode disalin ke clipboard.");
}

let mermaidRun = 0;
async function renderMermaid(root: HTMLElement) {
  const nodes = root.querySelectorAll<HTMLElement>("pre.mermaid");
  if (!nodes.length) return;
  const run = ++mermaidRun;
  try {
    // Loaded only when a document actually contains a diagram (~1MB).
    const { default: mermaid } = await import("mermaid");
    if (run !== mermaidRun) return;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: props.isDark ? "dark" : "default",
      fontFamily: "inherit",
    });
    await mermaid.run({ nodes: [...nodes], suppressErrors: true });
  } catch (err) {
    console.error("mermaid failed", err);
    nodes.forEach((n) => n.classList.add("mermaid-error"));
  }
}

// Re-inject on content or theme change (mermaid needs a fresh source to re-theme).
watch(
  () => [props.html, props.isDark, article.value] as const,
  ([html, , el]) => {
    if (!el) return;
    el.innerHTML = html;
    fixImages(el);
    addCopyButtons(el);
    void renderMermaid(el);
  },
  { immediate: true, flush: "post" },
);

async function onClick(event: MouseEvent) {
  const copyBtn = (event.target as HTMLElement).closest<HTMLButtonElement>("button.copy-btn");
  if (copyBtn) {
    await copyCode(copyBtn);
    return;
  }
  const link = (event.target as HTMLElement).closest("a");
  const href = link?.getAttribute("href");
  if (!link || !href) return;
  event.preventDefault();

  try {
    if (href.startsWith("#")) {
      const id = decodeURIComponent(href.slice(1));
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (EXTERNAL.test(href)) {
      await openUrl(href);
      return;
    }
    const target = toLocalPath(href.split("#")[0]);
    if (isMarkdownPath(target)) emit("openFile", target);
    else await revealItemInDir(target);
  } catch (err) {
    console.error("link failed", href, err);
    toast.error("Link tidak bisa dibuka.");
  }
}
</script>

<template>
  <article
    ref="article"
    class="markdown-body doc-width py-8"
    :style="{ zoom: props.zoom }"
    @click="onClick"
  ></article>
</template>

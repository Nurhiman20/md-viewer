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
    void renderMermaid(el);
  },
  { immediate: true, flush: "post" },
);

async function onClick(event: MouseEvent) {
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

import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import katexModule from "@vscode/markdown-it-katex";
import katex from "katex";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

const languages = {
  bash, c, cpp, csharp, css, diff, go, ini, java, javascript, json, markdown,
  php, powershell, python, rust, sql, typescript, xml, yaml,
};
for (const [name, lang] of Object.entries(languages)) hljs.registerLanguage(name, lang);
hljs.registerAliases(["sh", "shell", "zsh", "console"], { languageName: "bash" });
hljs.registerAliases(["toml"], { languageName: "ini" });
hljs.registerAliases(["vue", "svelte"], { languageName: "xml" });

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

// CJS package with `exports.default`: dev pre-bundling hands us the module object.
const katexPlugin: typeof katexModule =
  (katexModule as unknown as { default?: typeof katexModule }).default ?? katexModule;

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code: string, lang: string) {
    const language = lang && hljs.getLanguage(lang) ? lang : null;
    const body = language
      ? hljs.highlight(code, { language, ignoreIllegals: true }).value
      : escapeHtml(code);
    const label = lang ? ` data-lang="${escapeHtml(lang)}"` : "";
    return `<pre class="code-block"${label}><code class="hljs">${body}</code></pre>`;
  },
})
  .use(anchor, { tabIndex: false })
  .use(footnote)
  .use(taskLists, { enabled: false, label: true })
  .use(katexPlugin, { katex, enableFencedBlocks: true, throwOnError: false });

// Mermaid blocks render lazily in MarkdownView; keep the source as plain text here.
type RenderRule = NonNullable<typeof md.renderer.rules.fence>;
const defaultFence: RenderRule = md.renderer.rules.fence!;
md.renderer.rules.fence = (...args: Parameters<RenderRule>) => {
  const [tokens, idx] = args;
  const token = tokens[idx];
  if (token.info.trim().split(/\s+/)[0] === "mermaid") {
    return `<pre class="mermaid">${escapeHtml(token.content)}</pre>`;
  }
  return defaultFence(...args);
};

/** Markdown source → sanitized HTML. Scripts and event handlers in the file never run. */
export function renderMarkdown(source: string): string {
  const html = md.render(source);
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, mathMl: true },
    ADD_ATTR: ["target"],
  });
}

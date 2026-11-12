# MD Viewer

Lightweight, read-only Markdown viewer for Windows built with Tauri v2 + Vue 3.

## Features

- Open via double-click / "Open with" (`.md`, `.markdown` file association), `Ctrl+O`, or drag & drop
- Single window: opening another file from Explorer reuses the running app
- Live reload when the file changes on disk (scroll position kept)
- GitHub-style rendering: tables, task lists, footnotes, syntax highlighting, KaTeX math, Mermaid diagrams (loaded lazily)
- Relative images and links to other `.md` files; external links open in the browser
- Light / dark / system theme, zoom, recent files — remembered automatically
- Untrusted HTML in documents is sanitized (DOMPurify); the app has read-only file access

## Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+O` | Open file |
| `F5` / `Ctrl+R` | Reload |
| `Ctrl+=` / `Ctrl+-` / `Ctrl+0` | Zoom in / out / reset |

## Development

Prerequisites: Node 20+, Rust (stable-msvc), Visual Studio Build Tools (C++ workload), WebView2.

```sh
npm install
npm run tauri dev -- -- "C:\path\to\file.md"   # file argument optional
```

`samples/` contains a document exercising every rendering feature.

## Build & Install

```sh
npm install
npm run tauri build
```

Output: `src-tauri\target\release\bundle\nsis\MD Viewer_<version>_x64-setup.exe`. The first build is slow because Rust compiles every dependency; later builds are much faster.

To install:

1. Run the `*-setup.exe`. It installs for the current user, so admin rights are not needed.
2. `.md` / `.markdown` files are associated with MD Viewer. If Windows keeps the old default app, right-click a `.md` file → **Open with** → **Choose another app** → **MD Viewer** → **Always**.

To uninstall, go to **Settings → Apps → Installed apps → MD Viewer → Uninstall**.

## Structure

```
src/lib/markdown.ts            markdown-it pipeline + sanitize
src/lib/path.ts                path helpers (resolve relative links/images)
src/composables/               document state, file watcher, preferences, toasts
src/components/                toolbar, markdown view, empty/error/skeleton states
src-tauri/src/lib.rs           startup file arg + single-instance forwarding
src-tauri/tauri.conf.json      file association, CSP, asset protocol
src-tauri/capabilities/        read-only fs permissions
```

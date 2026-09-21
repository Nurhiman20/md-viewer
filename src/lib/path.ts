// Small Windows-friendly path helpers. Kept sync (unlike @tauri-apps/api/path)
// because they run for every link and image in a rendered document.

const SEP = /[\\/]/;

export function basename(path: string): string {
  const parts = path.split(SEP);
  return parts[parts.length - 1] || path;
}

export function dirname(path: string): string {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i > 0 ? path.slice(0, i) : path;
}

export function isAbsolute(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith("\\\\") || path.startsWith("/");
}

/** Resolve `rel` (as written in markdown, possibly URL-encoded) against directory `base`. */
export function resolvePath(base: string, rel: string): string {
  let target = rel;
  try {
    target = decodeURI(rel);
  } catch {
    // keep raw value when it isn't valid URI encoding
  }
  const root = isAbsolute(target) ? "" : base;
  const segments: string[] = [];
  for (const part of `${root}/${target}`.split(SEP)) {
    if (part === "" || part === ".") continue;
    if (part === "..") segments.pop();
    else segments.push(part);
  }
  const joined = segments.join("\\");
  if (base.startsWith("\\\\") && !isAbsolute(target)) return `\\\\${joined}`;
  return joined;
}

/** Normalised form for comparing paths reported by different APIs. */
export function samePath(a: string, b: string): boolean {
  const norm = (p: string) => p.replace(/[\\/]+/g, "\\").replace(/^\\\\\?\\/, "").toLowerCase();
  return norm(a) === norm(b);
}

export const MARKDOWN_EXT = ["md", "markdown"];

export function isMarkdownPath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MARKDOWN_EXT.includes(ext);
}

import { onScopeDispose, watch, type Ref } from "vue";
import { exists, watch as watchFs, type UnwatchFn } from "@tauri-apps/plugin-fs";
import { dirname, samePath } from "../lib/path";

/**
 * Calls `onChange` when the file at `path` is modified, or `onMissing` when it disappears.
 * Watches the parent directory: editors often save via write-temp-then-rename,
 * which would silently break a watch on the file itself.
 */
export function useFileWatcher(
  path: Ref<string | null>,
  onChange: () => void,
  onMissing: () => void,
) {
  let unwatch: UnwatchFn | null = null;
  let generation = 0;

  function stop() {
    generation++;
    unwatch?.();
    unwatch = null;
  }

  watch(
    path,
    async (file) => {
      stop();
      if (!file) return;
      const current = generation;
      try {
        const fn = await watchFs(
          dirname(file),
          async (event) => {
            if (!event.paths.some((p) => samePath(p, file))) return;
            if (await exists(file)) onChange();
            else onMissing();
          },
          { recursive: false, delayMs: 300 },
        );
        // Path changed while we were subscribing: drop this watcher.
        if (current !== generation) fn();
        else unwatch = fn;
      } catch (err) {
        // Live reload is a convenience; viewing still works without it.
        console.warn("file watch unavailable", file, err);
      }
    },
    { immediate: true },
  );

  onScopeDispose(stop);
}

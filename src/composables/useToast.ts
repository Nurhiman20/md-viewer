import { ref } from "vue";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

function push(kind: ToastKind, message: string, duration = kind === "error" ? 5000 : 2500) {
  const id = nextId++;
  // Replace an identical toast instead of stacking duplicates (e.g. rapid live reloads).
  toasts.value = [...toasts.value.filter((t) => t.message !== message), { id, kind, message }];
  setTimeout(() => dismiss(id), duration);
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string) => push("success", message),
    error: (message: string) => push("error", message),
    info: (message: string) => push("info", message),
  };
}

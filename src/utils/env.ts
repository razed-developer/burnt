/**
 * Detect whether we are running inside a Tauri WebView.
 * During Phase 1 development the frontend can also run in a plain browser
 * (via `npm run dev`) where no Rust commands exist; services fall back to
 * simulated behavior in that case.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

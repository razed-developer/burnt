import { useEffect } from "react";
import type { Theme } from "../types";

/** Resolve the effective theme given the preference and the OS. */
function resolveTheme(preference: Theme): "light" | "dark" {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return preference;
}

/**
 * Applies a `data-theme` attribute on <html> so CSS tokens switch between
 * light and dark, and keeps it in sync with system changes when in system mode.
 */
export function useTheme(theme: Theme): void {
  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.setAttribute("data-theme", resolved);
    };
    apply();
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply();
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
  }, [theme]);
}

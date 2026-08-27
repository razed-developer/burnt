import { useEffect } from "react";
import type { Settings } from "../../types";
import type { Theme } from "../../hooks/useTheme";

interface SettingsPageProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsPage({
  settings,
  onSettingsChange,
  onClose,
}: SettingsPageProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const update = (patch: Partial<Settings>) => {
    onSettingsChange({ ...settings, ...patch });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Settings</h1>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text p-1"
          aria-label="Close settings"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 5L15 15M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Burning
          </h2>

          <div className="space-y-1">
            <label className="text-sm text-text-muted">Drive</label>
            <select
              value={settings.preferredDrive}
              onChange={(e) => update({ preferredDrive: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="automatic">Automatic</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ejectAfterBurn}
              onChange={(e) => update({ ejectAfterBurn: e.target.checked })}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-sm">Eject disc when finished</span>
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Appearance
          </h2>

          <div className="space-y-1">
            <label className="text-sm text-text-muted">Theme</label>
            <div className="flex gap-1">
              {(["system", "light", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => update({ theme: t })}
                  className={`px-3 py-1.5 text-sm rounded capitalize transition-colors ${
                    settings.theme === t
                      ? "bg-accent text-accent-text"
                      : "bg-surface-overlay text-text-muted hover:text-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Advanced
          </h2>

          <div className="space-y-1">
            <label className="text-sm text-text-muted">Burn speed</label>
            <select
              value={settings.burnSpeed}
              onChange={(e) => update({ burnSpeed: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface-raised border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="automatic">Automatic</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
              <option value="8">8x</option>
              <option value="16">16x</option>
              <option value="24">24x</option>
              <option value="32">32x</option>
              <option value="40">40x</option>
              <option value="48">48x</option>
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-faint">
            About
          </h2>
          <div className="text-sm text-text-muted space-y-2">
            <div className="font-medium text-text">Burnt</div>
            <div>Version 0.1.0</div>
            <div className="text-xs text-text-faint leading-relaxed">
              A simple audio CD burner.
              <br />
              Uses cdrdao for disc writing.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { BurnerPage } from "./pages/Burner/BurnerPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { DEFAULT_SETTINGS } from "./types";
import type { Settings } from "./types";

export default function App() {
  const { theme, setTheme } = useTheme(DEFAULT_SETTINGS.theme);
  const [settings, setSettings] = useState<Settings>({
    ...DEFAULT_SETTINGS,
    theme,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [cdTitle, setCdTitle] = useState("");
  const [trackCount, setTrackCount] = useState(0);
  const [burnStatus, setBurnStatus] = useState<string>("idle");

  useEffect(() => {
    import("@tauri-apps/api/webviewWindow").then(({ getCurrentWebviewWindow }) => {
      const win = getCurrentWebviewWindow();
      let title = "Burnt";
      if (burnStatus === "burning" || burnStatus === "preparing" || burnStatus === "finalizing") {
        title = `Burnt \u2014 Burning\u2026`;
      } else if (trackCount > 0) {
        title = `Burnt \u2014 ${trackCount} track${trackCount === 1 ? "" : "s"}`;
      }
      if (cdTitle) {
        title += ` \u2014 ${cdTitle}`;
      }
      win.setTitle(title);
    });
  }, [trackCount, burnStatus, cdTitle]);

  const handleSettingsChange = useCallback(
    (newSettings: Settings) => {
      setSettings(newSettings);
      if (newSettings.theme !== theme) {
        setTheme(newSettings.theme);
      }
    },
    [theme, setTheme]
  );

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <div className="h-full bg-surface text-text">
      {showSettings ? (
        <SettingsPage
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={handleCloseSettings}
        />
      ) : (
        <BurnerPage
          settings={settings}
          onOpenSettings={handleOpenSettings}
          cdTitle={cdTitle}
          onCdTitleChange={setCdTitle}
          onTrackCountChange={setTrackCount}
          onBurnStatusChange={setBurnStatus}
        />
      )}
    </div>
  );
}

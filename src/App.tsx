import { useState, useCallback } from "react";
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
        />
      )}
    </div>
  );
}

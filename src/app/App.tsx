import { useState } from "react";
import { AppProvider, useApp } from "./AppContext";
import { useTheme } from "../hooks/useTheme";
import BurnerPage from "../pages/Burner/BurnerPage";
import SettingsPage from "../pages/Settings/SettingsPage";

export type Page = "burner" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("burner");

  return (
    <AppProvider>
      <ThemedApp page={page} onChangePage={setPage} />
    </AppProvider>
  );
}

function ThemedApp({ page, onChangePage }: { page: Page; onChangePage: (p: Page) => void }) {
  const theme = useApp().settings.theme;
  useTheme(theme);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">Burnt</span>
        <nav className="app-nav" aria-label="Navigation">
          <button className={page === "burner" ? "nav-link active" : "nav-link"} onClick={() => onChangePage("burner")}>
            New Audio CD
          </button>
          <button className={page === "settings" ? "nav-link active" : "nav-link"} onClick={() => onChangePage("settings")}>
            Settings
          </button>
        </nav>
      </header>
      <main className="app-main">
        {page === "burner" ? <BurnerPage /> : <SettingsPage />}
      </main>
    </div>
  );
}

import "./SettingsPage.css";
import { useApp } from "../../app/AppContext";
import DriveSelector from "../../components/DriveSelector/DriveSelector";
import type { Theme } from "../../types";

/**
 * Settings page: theme, burn defaults, and drive selection. Edits write
 * straight through to app (and persisted) settings.
 */
export default function SettingsPage() {
  const { settings, updateSettings, drives, setDiscStateOverride } = useApp();

  return (
    <div className="settings">
      <h1 className="settings-heading">Settings</h1>

      <section className="section-block">
        <h2 className="settings-sub">Appearance</h2>
        <div className="settings-row">
          <span>Theme</span>
          <select
            className="settings-select"
            value={settings.theme}
            onChange={(e) => updateSettings({ theme: e.target.value as Theme })}
          >
            <option value="system">Follow system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section className="section-block">
        <h2 className="settings-sub">Drives</h2>
        <DriveSelector
          id="settings-drive"
          drives={drives}
          selection={settings.preferredDrive}
          onChange={(selection) => updateSettings({ preferredDrive: selection })}
        />
        {drives.length > 0 && (
          <button className="settings-action" onClick={() => void setDiscStateOverride("cycle")}>
            Simulate next disc state
          </button>
        )}
      </section>

      <section className="section-block">
        <h2 className="settings-sub">Burn</h2>
        <label className="settings-row">
          <input
            type="checkbox"
            checked={settings.ejectAfterBurn}
            onChange={(e) => updateSettings({ ejectAfterBurn: e.target.checked })}
          />
          <span>Eject the disc after burning</span>
        </label>
      </section>
    </div>
  );
}

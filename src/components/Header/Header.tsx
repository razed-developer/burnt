import React from 'react';
import { Settings, Disc, Sun, Moon, Laptop } from 'lucide-react';
import { BurnSettings, OpticalDrive } from '../../types';

interface HeaderProps {
  settings: BurnSettings;
  onUpdateSettings: (newSettings: Partial<BurnSettings>) => void;
  onOpenSettings: () => void;
  activeDrive: OpticalDrive;
  drives: OpticalDrive[];
  onSelectDrive: (driveId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  activeDrive,
  drives,
  onSelectDrive,
}) => {
  const cycleTheme = () => {
    const nextTheme: Record<string, BurnSettings['theme']> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    onUpdateSettings({ theme: nextTheme[settings.theme] || 'light' });
  };

  return (
    <header className="w-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-5 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-600 dark:bg-orange-500 flex items-center justify-center text-white shadow-xs">
          <Disc className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Burnt
          </span>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
            v1.0.0
          </span>
          <span className="hidden sm:inline-block text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Audio CD Burner
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Drive quick picker */}
        <div className="relative">
          <label htmlFor="drive-select-header" className="sr-only">Select optical burner</label>
          <select
            id="drive-select-header"
            value={activeDrive.id}
            onChange={(e) => onSelectDrive(e.target.value)}
            className="text-xs font-medium bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-750 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer pr-7 max-w-[180px] sm:max-w-[240px] truncate"
          >
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.mediaInserted ? d.mediaType : 'No Disc'})
              </option>
            ))}
          </select>
        </div>

        {/* Theme button */}
        <button
          onClick={cycleTheme}
          aria-label={`Current theme: ${settings.theme}. Click to switch theme.`}
          title={`Theme: ${settings.theme}`}
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          {settings.theme === 'light' && <Sun className="w-4 h-4" />}
          {settings.theme === 'dark' && <Moon className="w-4 h-4" />}
          {settings.theme === 'system' && <Laptop className="w-4 h-4" />}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Open application settings"
          title="Settings"
          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

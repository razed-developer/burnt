import React from 'react';
import { X, Sliders, Moon, Sun, Laptop, Disc, ShieldCheck, Flame } from 'lucide-react';
import { BurnSettings, OpticalDrive } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BurnSettings;
  onUpdateSettings: (newSettings: Partial<BurnSettings>) => void;
  drives: OpticalDrive[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  drives,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION: BURNING */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5" />
              Burning
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Default Optical Writer
                </label>
                <select
                  value={settings.preferredDriveId}
                  onChange={(e) => onUpdateSettings({ preferredDriveId: e.target.value })}
                  className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.vendor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Eject disc when finished
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Automatically open drive tray when the Audio CD burn completes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ejectAfterBurn}
                  onChange={(e) => onUpdateSettings({ ejectAfterBurn: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Write CD-TEXT Metadata
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Embed album title, artist, and song names in Red Book subchannels.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableCdText}
                  onChange={(e) => onUpdateSettings({ enableCdText: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION: APPEARANCE */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'system' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  settings.theme === 'system'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                System
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  settings.theme === 'light'
                    ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-orange-500 bg-orange-950/40 text-orange-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* SECTION: ADVANCED */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Advanced
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Burn Speed
                </label>
                <select
                  value={settings.burnSpeed}
                  onChange={(e) => onUpdateSettings({ burnSpeed: e.target.value })}
                  className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value="auto">Automatic (Recommended)</option>
                  <option value="4x">4x (High Accuracy / Audiophile)</option>
                  <option value="8x">8x</option>
                  <option value="16x">16x</option>
                  <option value="24x">24x</option>
                  <option value="32x">32x</option>
                  <option value="48x">48x (Fastest)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Standard Track Pregap
                </label>
                <select
                  value={settings.pregapSeconds}
                  onChange={(e) => onUpdateSettings({ pregapSeconds: Number(e.target.value) })}
                  className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-neutral-800 dark:text-neutral-200 focus:outline-none"
                >
                  <option value={2}>2 Seconds (Red Book Standard)</option>
                  <option value={0}>0 Seconds (Gapless Live Album)</option>
                  <option value={1}>1 Second</option>
                  <option value={3}>3 Seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION: ABOUT */}
          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-5 text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5 font-mono">
            <div className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200 font-semibold font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Burnt — Simple Modern Audio CD Burner</span>
            </div>
            <p className="text-[11px] leading-relaxed font-sans">
              Designed for Red Book (Compact Disc Digital Audio) compliance: 16-bit stereo PCM, 44.1 kHz sample rate, DAO (Disc-At-Once) authoring.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-850 px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

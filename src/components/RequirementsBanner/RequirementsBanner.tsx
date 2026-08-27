import type { RequirementsStatus } from "../../services/requirements";

interface RequirementsBannerProps {
  requirements: RequirementsStatus;
}

export function RequirementsBanner({ requirements }: RequirementsBannerProps) {
  if (requirements.all_met) return null;

  const missing: { name: string; purpose: string; install: string }[] = [];

  if (!requirements.ffprobe.available || !requirements.ffmpeg.available) {
    missing.push({
      name: "FFmpeg",
      purpose: "Needed to read and convert audio files",
      install: "Windows: https://www.gyan.dev/ffmpeg/builds/\nLinux: sudo apt install ffmpeg",
    });
  }

  if (!requirements.cdrdao.available) {
    missing.push({
      name: "cdrdao",
      purpose: "Needed to burn audio CDs",
      install: "Windows: https://github.com/cdrdao/cdrdao/releases\nLinux: sudo apt install cdrdao",
    });
  }

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="text-warning text-lg shrink-0 mt-0.5">!</div>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="text-sm font-medium text-text">
            Missing requirements
          </div>
          <div className="text-xs text-text-muted leading-relaxed space-y-3">
            {missing.map((m) => (
              <div key={m.name} className="space-y-1">
                <div>
                  <span className="font-medium text-text">{m.name}</span>
                  <span className="text-text-faint"> &mdash; </span>
                  <span>{m.purpose}</span>
                </div>
                <div className="text-text-faint whitespace-pre-line pl-3 border-l-2 border-border">
                  {m.install}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

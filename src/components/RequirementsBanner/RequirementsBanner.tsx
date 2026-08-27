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
    <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-warning font-bold shrink-0">!</span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-text">Missing requirements</span>
          <span className="text-text-faint"> &mdash; </span>
          {missing.map((m, i) => (
            <span key={m.name}>
              {i > 0 && <span className="text-text-faint"> &middot; </span>}
              <span className="font-medium text-text">{m.name}</span>
              {" "}
              <span className="text-text-faint whitespace-pre-line">{m.purpose}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

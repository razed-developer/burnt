import { useState, useEffect } from "react";
import type { RequirementsStatus } from "../services/requirements";
import { checkRequirements } from "../services/requirements";

export function useRequirements() {
  const [reqs, setReqs] = useState<RequirementsStatus | null>(null);

  useEffect(() => {
    checkRequirements()
      .then(setReqs)
      .catch(() => {
        setReqs({
          ffprobe: { name: "ffprobe", available: false, path: null },
          ffmpeg: { name: "ffmpeg", available: false, path: null },
          cdrdao: { name: "cdrdao", available: false, path: null },
          all_met: false,
        });
      });
  }, []);

  return reqs;
}

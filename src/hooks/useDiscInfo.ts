import { useState, useEffect, useCallback } from "react";
import type { DiscInfo, DiscState } from "../types";
import { getDiscInfo } from "../services/disc";
import type { MediaResponse } from "../services/disc";

function mapDiscState(state: string): DiscState {
  switch (state) {
    case "no-drive":
      return "no-drive";
    case "no-media":
      return "no-media";
    case "blank":
      return "blank";
    case "not-blank":
      return "not-blank";
    case "not-writable":
      return "not-writable";
    default:
      return "unknown";
  }
}

function mapResponse(r: MediaResponse): DiscInfo {
  const hasDrive = r.drive_path !== null;
  return {
    hasDrive,
    driveName: r.drive_name,
    drivePath: r.drive_path,
    hasMedia: r.has_media,
    isBlank: r.is_blank,
    isWritable: r.is_writable,
    capacityMinutes: r.capacity_minutes,
    mediaType: r.media_type,
    discState: mapDiscState(r.disc_state),
  };
}

function fallbackDisc(): DiscInfo {
  return {
    hasDrive: false,
    driveName: null,
    drivePath: null,
    hasMedia: false,
    isBlank: false,
    isWritable: false,
    capacityMinutes: 80,
    mediaType: null,
    discState: "unknown",
  };
}

export function useDiscInfo() {
  const [disc, setDisc] = useState<DiscInfo>(fallbackDisc);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await getDiscInfo();
      setDisc(mapResponse(response));
    } catch (err) {
      console.error("Failed to detect disc:", err);
      setDisc(fallbackDisc());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { disc, refresh, isLoading };
}

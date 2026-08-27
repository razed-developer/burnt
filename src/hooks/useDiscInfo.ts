import { useState, useCallback } from "react";
import type { DiscInfo, DiscState } from "../types";

function getSimulatedDisc(): DiscInfo {
  return {
    hasDrive: true,
    driveName: "HL-DT-ST BD-RE BH12LS35",
    drivePath: "D:",
    hasMedia: true,
    isBlank: true,
    isWritable: true,
    capacityMinutes: 80,
    mediaType: "CD-R",
    discState: "blank" as DiscState,
  };
}

export function useDiscInfo() {
  const [disc, setDisc] = useState<DiscInfo>(getSimulatedDisc());

  const refresh = useCallback(() => {
    setDisc(getSimulatedDisc());
  }, []);

  return { disc, refresh };
}

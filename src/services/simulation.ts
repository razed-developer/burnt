import type { DiscStatus, Track } from "../types/burner";

export const simulatedDisc: DiscStatus = {
  state: "ready",
  label: "Blank CD-R ready",
};

const demoDurations = [237, 184, 261, 215, 198];

export function demoTracks(): Track[] {
  return ["Everybody Wants to Rule the World.mp3", "Take On Me.flac", "Dreams.m4a", "Africa.wav"].map(
    (name, index) => ({
      id: crypto.randomUUID(),
      name,
      path: `demo/${name}`,
      durationSeconds: demoDurations[index],
    }),
  );
}

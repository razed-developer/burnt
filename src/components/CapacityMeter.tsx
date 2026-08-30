import { formatDuration } from "../utils/time";

interface CapacityMeterProps {
  usedSeconds: number;
  capacitySeconds?: number;
}

export function CapacityMeter({ usedSeconds, capacitySeconds = 80 * 60 }: CapacityMeterProps) {
  const percent = Math.min(100, (usedSeconds / capacitySeconds) * 100);
  const remaining = Math.max(0, capacitySeconds - usedSeconds);
  const over = usedSeconds > capacitySeconds;

  return (
    <section className={`capacity ${over ? "over" : ""}`} aria-label="CD capacity">
      <div className="capacity-copy">
        <strong>{formatDuration(usedSeconds)} used</strong>
        <span>{over ? `${formatDuration(usedSeconds - capacitySeconds)} over capacity` : `${formatDuration(remaining)} remaining`}</span>
      </div>
      <div className="meter"><div className="meter-fill" style={{ width: `${percent}%` }} /></div>
    </section>
  );
}

import "./CapacityMeter.css";
import { formatDuration } from "../../utils/format";

interface CapacityMeterProps {
  usedSeconds: number;
  capacitySeconds: number | null;
}

/**
 * Presents disc capacity primarily as playing time.
 *
 * The component receives duration values (not file sizes) and renders the
 * fill along with used/remaining/over-capacity text. It does not perform any
 * audio or disc logic.
 */
export default function CapacityMeter({ usedSeconds, capacitySeconds }: CapacityMeterProps) {
  const capacity = capacitySeconds ?? 80 * 60;
  const over = usedSeconds > capacity;
  const ratio = capacity > 0 ? usedSeconds / capacity : 0;
  const pct = Math.min(100, Math.max(0, ratio * 100));
  const remaining = Math.max(0, capacity - usedSeconds);
  const overSeconds = Math.max(0, usedSeconds - capacity);

  const meterClass =
    over ? "meter-bar over"
    : pct >= 95 ? "meter-bar warn"
    : "meter-bar";

  return (
    <section className="capacity section-block" aria-label="Disc capacity">
      <div className="section-header">
        <h2 className="section-title">Disc Capacity</h2>
        <span className="capacity-total">
          {formatDuration(usedSeconds, { showHours: true })} / {formatDuration(capacity, { showHours: true })}
        </span>
      </div>

      <div className="meter" role="img" aria-label={`${Math.round(pct)} percent of disc capacity used`}>
        <div className={meterClass} style={{ width: `${pct}%` }} />
      </div>

      <div className="capacity-labels">
        {over ? (
          <span className="capacity-over">
            {formatDuration(usedSeconds, { showHours: true })} — {formatDuration(overSeconds)} too long
          </span>
        ) : (
          <span className="capacity-remaining">{formatDuration(remaining, { showHours: true })} remaining</span>
        )}
      </div>
    </section>
  );
}

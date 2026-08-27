import "./DiscStatus.css";
import { useApp } from "../../app/AppContext";
import type { DiscState } from "../../types";
import { isTauri } from "../../utils/env";

function statusClass(state: DiscState): string {
  switch (state.kind) {
    case "blank":
      return "disc-status ok";
    case "writerReady":
    case "noMedia":
      return "disc-status neutral";
    case "noWriter":
      return "disc-status muted";
    case "checking":
      return "disc-status neutral";
    default:
      return "disc-status warn";
  }
}

/**
 * Displays the plain-language disc state. It receives a normalized DiscState;
 * it never interprets backend/SCSI output.
 */
export default function DiscStatus() {
  const { discState, setDiscStateOverride } = useApp();

  if (!discState) {
    return (
      <section className="disc section-block disc-status neutral">
        <span className="disc-label">Checking disc…</span>
      </section>
    );
  }

  return (
    <section className={statusClass(discState)} aria-label="Disc status">
      <div className="disc-row">
        <span className="disc-label">{discState.label}</span>
        {!isTauri() && (
          <button className="disc-debug" onClick={() => setDiscStateOverride(discState.kind)} aria-label="Cycle simulated disc state">
            Simulate next state
          </button>
        )}
      </div>
      {discState.detail && <p className="disc-detail">{discState.detail}</p>}
    </section>
  );
}

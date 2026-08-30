import { CheckCircle2, Disc3 } from "lucide-react";
import type { DiscStatus } from "../types/burner";

export function DiscStatusBar({ status }: { status: DiscStatus }) {
  const ready = status.state === "ready";
  return (
    <div className={`disc-status ${ready ? "ready" : ""}`}>
      {ready ? <CheckCircle2 size={20} /> : <Disc3 size={20} />}
      <div><strong>{status.label}</strong><small>{ready ? "Ready when you are." : "Burnt will detect your disc automatically."}</small></div>
    </div>
  );
}

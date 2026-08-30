import { CheckCircle2, Disc3, LoaderCircle } from "lucide-react";
import type { DiscStatus } from "../types/burner";

export function DiscStatusBar({ status }: { status: DiscStatus }) {
  const ready = status.state === "ready";
  const active = status.state === "checking" || status.state === "busy";
  const detail = ready ? "Ready when you are." : status.state === "used" ? "Insert a blank CD to burn." : status.state === "complete" ? "The finished disc has been ejected." : "Burnt will detect your disc automatically.";
  return (
    <div className={`disc-status ${ready ? "ready" : ""}`}>
      {ready ? <CheckCircle2 size={20} /> : active ? <LoaderCircle size={20} /> : <Disc3 size={20} />}
      <div><strong>{status.label}</strong><small>{detail}</small></div>
    </div>
  );
}

import { Flame } from "lucide-react";

interface BurnButtonProps {
  disabled: boolean;
  onClick: () => void;
  burning: boolean;
}

export function BurnButton({ disabled, onClick, burning }: BurnButtonProps) {
  return (
    <button className="burn-button" disabled={disabled} onClick={onClick}>
      <Flame size={20} fill="currentColor" />
      {burning ? "Preparing audio…" : "Burn CD"}
    </button>
  );
}

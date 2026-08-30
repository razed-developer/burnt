interface DiscTitleProps {
  value: string;
  onChange: (value: string) => void;
}

export function DiscTitle({ value, onChange }: DiscTitleProps) {
  return (
    <label className="title-field">
      <span>CD title <small>optional</small></span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="My mix"
        maxLength={80}
      />
    </label>
  );
}

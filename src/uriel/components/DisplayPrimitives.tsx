export function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : undefined}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function NumberRow({
  numbers,
  compact = false,
}: {
  numbers: readonly number[];
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? 'number-row is-compact' : 'number-row'}
      aria-label={numbers.join(', ')}
    >
      {numbers.map((number) => (
        <span key={number} data-band={Math.min(Math.floor((number - 1) / 10), 4)}>
          {number}
        </span>
      ))}
    </div>
  );
}

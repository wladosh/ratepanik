export function PlayerNameRow({
  name,
  isMe,
  youLabel = "Du",
  className,
}: {
  name: string;
  isMe: boolean;
  youLabel?: string;
  className?: string;
}) {
  return (
    <span className={["flex min-w-0 items-center gap-1.5", className].filter(Boolean).join(" ")}>
      <span className="min-w-0 truncate font-bold">{name}</span>
      {isMe ? (
        <span
          className="shrink-0 px-2 py-0.5 text-[10px] font-black uppercase"
          style={{
            background: "var(--rp-nb-lilac)",
            color: "var(--rp-nb-black)",
            border: "var(--rp-nb-border)",
            borderRadius: "var(--rp-nb-radius-sm)",
            boxShadow: "var(--rp-nb-shadow-sm)",
            letterSpacing: "0.06em",
          }}
        >
          {youLabel}
        </span>
      ) : null}
    </span>
  );
}

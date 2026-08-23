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
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase"
          style={{ background: "var(--rp-purple-soft)", color: "var(--rp-purple)" }}
        >
          {youLabel}
        </span>
      ) : null}
    </span>
  );
}

"use client";

interface WaitingFooterProps {
  answered: number;
  total: number;
}

export function WaitingFooter({ answered, total }: WaitingFooterProps) {
  if (total <= 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 py-3 px-4"
      style={{
        background: "rgba(255, 255, 255, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: "1px solid var(--rp-border)",
      }}
    >
      <span
        className="text-sm font-semibold"
        style={{ color: "var(--rp-text-secondary)" }}
      >
        <span style={{ color: "var(--rp-peach)", fontVariantNumeric: "tabular-nums" }}>
          {answered}/{total}
        </span>
        {" "}haben schon peinlich getippt
      </span>
    </div>
  );
}

export function AuthErrorBanner({
  message,
  hint,
}: {
  message: string;
  hint?: string;
}) {
  return (
    <div
      role="alert"
      className="nb-card px-4 py-3 text-sm font-bold"
      style={{
        background: "#FFB3C0",
        color: "var(--rp-nb-black)",
      }}
    >
      <p>{message}</p>
      {hint ? (
        <p
          className="mt-1.5 text-xs font-semibold"
          style={{ color: "var(--rp-nb-text-secondary)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

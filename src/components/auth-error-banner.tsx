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
      className="rounded-xl px-4 py-3 text-sm font-medium"
      style={{
        background: "rgba(255, 92, 122, 0.1)",
        border: "1px solid rgba(255, 92, 122, 0.2)",
        color: "var(--rp-danger)",
      }}
    >
      <p>{message}</p>
      {hint ? (
        <p
          className="mt-1.5 text-xs font-normal"
          style={{ color: "var(--rp-text-secondary)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

import type { Messages } from "./i18n";

export type AuthErrorInfo = {
  message: string;
  hint?: string;
};

type AuthLikeError = {
  message?: string;
  code?: string;
  status?: number;
} | null | undefined;

function haystack(error: AuthLikeError): string {
  return `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
}

function isRateLimited(error: AuthLikeError, text: string): boolean {
  return (
    error?.status === 429 ||
    text.includes("over_email_send_rate_limit") ||
    text.includes("over_request_rate_limit") ||
    text.includes("rate limit") ||
    text.includes("email rate limit")
  );
}

/** Map GoTrue/Supabase auth failures to locale copy. Never show raw English API text. */
export function mapAuthError(t: Messages, error: AuthLikeError): AuthErrorInfo {
  const text = haystack(error);

  if (isRateLimited(error, text)) {
    return { message: t.auth.rateLimit, hint: t.auth.bypassHint };
  }

  if (
    text.includes("email_not_confirmed") ||
    text.includes("email not confirmed")
  ) {
    return {
      message: t.auth.emailNotConfirmed,
      hint: t.auth.emailNotConfirmedHint,
    };
  }

  if (
    text.includes("user_already_exists") ||
    text.includes("email_exists") ||
    text.includes("already registered") ||
    text.includes("user already registered")
  ) {
    return {
      message: t.auth.alreadyRegistered,
      hint: t.auth.alreadyRegisteredHint,
    };
  }

  if (
    text.includes("invalid_credentials") ||
    text.includes("invalid login credentials")
  ) {
    return { message: t.auth.invalidCredentials };
  }

  return { message: t.auth.generic, hint: t.auth.bypassHint };
}

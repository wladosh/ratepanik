import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function safeNextPath(next: string): string {
  if (next === "/") return "/";
  const join = next.match(/^\/\?join=([A-Za-z0-9]{6})$/);
  if (join) return `/?join=${join[1].toUpperCase()}`;
  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next") ?? "/");

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}

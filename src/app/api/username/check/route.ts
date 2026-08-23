import { NextRequest, NextResponse } from "next/server";
import { createAnonServerSupabase } from "@/lib/supabase/server";
import { usernameCheckCodeFromRpc } from "@/lib/match-ui";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ available: false, error: "missing" }, { status: 400 });
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return NextResponse.json({ available: false, error: "too_short" });
  }

  if (trimmed.length > 20) {
    return NextResponse.json({ available: false, error: "too_long" });
  }

  const supabase = createAnonServerSupabase();
  const { data, error } = await supabase.rpc("check_username_available", {
    desired_username: trimmed,
  });

  if (error) {
    return NextResponse.json({ available: false, error: "check_failed" }, { status: 500 });
  }

  const payload = data as { available?: boolean; error?: string | null } | null;
  if (payload?.available === true) {
    return NextResponse.json({ available: true, error: null });
  }

  return NextResponse.json({
    available: false,
    error: usernameCheckCodeFromRpc(payload?.error) ?? "taken",
  });
}

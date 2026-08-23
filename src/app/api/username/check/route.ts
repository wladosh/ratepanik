import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json(
      { available: false, error: "Kein Name angegeben" },
      { status: 400 }
    );
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return NextResponse.json({
      available: false,
      error: "Name zu kurz (min. 3 Zeichen)",
    });
  }

  if (trimmed.length > 20) {
    return NextResponse.json({
      available: false,
      error: "Name zu lang (max. 20 Zeichen)",
    });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return NextResponse.json(
      { available: false, error: "Nicht angemeldet" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase.rpc("check_username_available", {
    desired_username: trimmed,
  });

  if (error) {
    return NextResponse.json(
      { available: false, error: "Prüfung fehlgeschlagen" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

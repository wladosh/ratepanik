import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface DbRoom {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  current_question_index: number;
  question_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface DbPlayer {
  id: string;
  room_id: string;
  display_name: string;
  score: number;
  is_host: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface DbAnswer {
  id: string;
  room_id: string;
  player_id: string;
  question_index: number;
  choice_index: number;
  is_correct: boolean | null;
  answered_at: string;
}

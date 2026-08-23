import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export interface DbRoom {
  id: string;
  code: string;
  status: "lobby" | "playing" | "finished";
  current_question_index: number;
  question_ids: number[];
  current_block_index: number;
  total_blocks: number;
  host_user_id: string | null;
  theme_vote_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPlayer {
  id: string;
  room_id: string;
  user_id: string | null;
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
  block_index: number | null;
  round_index: number | null;
  prompt_id: string | null;
  mode: string | null;
  numeric_answer: number | null;
  distance: number | null;
  rank: number | null;
  points_awarded: number;
  time_ms: number | null;
}

export interface DbMatchBlock {
  id: string;
  room_id: string;
  block_index: number;
  mode: "number_guess" | "pick_correct";
  theme_id: string | null;
  theme_options: string[] | null;
  prompt_ids: string[];
  current_round: number;
  rounds_total: number;
  timer_seconds: number | null;
  is_complete: boolean;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface DbPickCorrectTurn {
  id: string;
  room_id: string;
  block_index: number;
  player_id: string;
  turn_order: number;
  card_index: number;
  is_correct: boolean;
  created_at: string;
}

export interface DbMatchScore {
  id: string;
  room_id: string;
  player_id: string;
  block_index: number;
  rank: number | null;
  total_points: number;
  created_at: string;
}

// ── Phase B: Progression ──────────────────────────────────────────

export interface DbProfile {
  id: string;
  username: string;
  xp: number;
  level: number;
  hirncoins: number;
  avatar_id: string;
  avatar_onboarding_done: boolean;
  current_streak?: number;
  friend_code?: string;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFriendProfile {
  id: string;
  username: string;
  avatar_id: string;
  last_seen_at: string | null;
  friend_code: string;
}

export interface DbFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
  updated_at: string;
}

export interface DbUserCosmetic {
  user_id: string;
  item_id: string;
  acquired_at: string;
}

export interface DbAchievement {
  id: string;
  title: string;
  description: string;
  icon_key: string;
  trigger: string;
  active: boolean;
}

export interface DbUserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface DbMatchReward {
  id: string;
  room_id: string;
  user_id: string;
  placement: number;
  xp_awarded: number;
  hirncoins_awarded: number;
  created_at: string;
}

-- Migration: Phase B — Progression schema (XP, Level, Hirncoins, Achievements, Rewards)
-- Depends on: 20240822_003_profiles_username (profiles table exists)
-- ADDITIVE ONLY — no existing columns/tables dropped.
-- Safe for live project uwbhgveknypqvrwazleq (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ============================================================
-- EXTEND profiles: progression + avatar columns
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hirncoins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avatar_id text NOT NULL DEFAULT 'default_01',
  ADD COLUMN IF NOT EXISTS avatar_onboarding_done boolean NOT NULL DEFAULT false;

-- Check constraints (idempotent via IF NOT EXISTS pattern with DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_xp_non_negative'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_xp_non_negative CHECK (xp >= 0);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_level_min'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_level_min CHECK (level >= 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_hirncoins_non_negative'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_hirncoins_non_negative CHECK (hirncoins >= 0);
  END IF;
END $$;

-- ============================================================
-- RLS adjustment: prevent client-side writes to xp/level/hirncoins
-- The existing "profiles_update_own" policy allows all column updates.
-- Replace with a policy that restricts writable columns.
-- ============================================================
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Security-definer function to restrict which columns authenticated users
-- can actually modify. XP/level/hirncoins are server-only (service role / RPCs).
CREATE OR REPLACE FUNCTION update_own_profile(
  new_username text DEFAULT NULL,
  new_avatar_id text DEFAULT NULL,
  new_avatar_onboarding_done boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nicht angemeldet');
  END IF;

  UPDATE profiles
  SET
    username = COALESCE(new_username, username),
    avatar_id = COALESCE(new_avatar_id, avatar_id),
    avatar_onboarding_done = COALESCE(new_avatar_onboarding_done, avatar_onboarding_done),
    updated_at = now()
  WHERE id = _uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================
-- TABLE: achievements (catalog of all possible achievements)
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon_key text NOT NULL,
  trigger text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_read_active" ON achievements
  FOR SELECT USING (active = true);

-- ============================================================
-- TABLE: user_achievements (unlocked achievements per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_read_own" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- No client INSERT policy — unlocks happen via service role / security definer RPCs.

-- ============================================================
-- TABLE: match_rewards (idempotent per-match XP/Hirncoins ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placement integer NOT NULL,
  xp_awarded integer NOT NULL DEFAULT 0,
  hirncoins_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_room_user_reward UNIQUE (room_id, user_id)
);

ALTER TABLE match_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_rewards_read_own" ON match_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- No client INSERT — rewards are granted server-side only.

-- ============================================================
-- SEED: achievements catalog (Fragemeister Phase B)
-- ON CONFLICT DO NOTHING for idempotent re-runs.
-- ============================================================
INSERT INTO achievements (id, title, description, icon_key, trigger) VALUES
  ('first_game',      'Erster Panik-Anfall',    'Du hast dein erstes Spiel überlebt.',                                         'rp_badge_first_game',    'games_finished >= 1'),
  ('first_win',       'Erster Sieg',            'Jemand hat verloren. Du nicht.',                                               'rp_badge_first_win',     'wins >= 1'),
  ('first_room',      'Gastgeber',              'Du hast einen Raum erstellt.',                                                 'rp_badge_first_room',    'rooms_created >= 1'),
  ('exact_hit',       'Bullseye',               'Exakter Treffer bei einer Schätzfrage.',                                       'rp_badge_exact_hit',     'number_guess_exact_hits >= 1'),
  ('exact_streak_3',  'Hellseher',              '3 exakte Schätz-Treffer in einer Session.',                                    'rp_badge_exact_streak_3','number_guess_exact_hits_in_session >= 3'),
  ('close_call',      'Knapp daneben ist auch… nah', 'Innerhalb von 5% der richtigen Zahl (ohne exakt).',                       'rp_badge_close_call',    'number_guess_within_5pct >= 1'),
  ('wild_guess',      'Mutig',                  'Deine Schätzung war um mehr als das 10-Fache daneben.',                        'rp_badge_wild_guess',    'number_guess_off_by_10x >= 1'),
  ('perfect_pick',    'Saubere Weste',          'Eine Pick-Correct-Runde mit 0 Fehlern (alle 4 richtig, keine Falschen).',      'rp_badge_perfect_pick',  'pick_correct_perfect_rounds >= 1'),
  ('pick_streak_3',   'Kartenscharf',           '3 perfekte Pick-Correct-Runden in einer Session.',                             'rp_badge_pick_streak_3', 'pick_correct_perfect_in_session >= 3'),
  ('almost',          'Fast',                   'Genau 3 von 4 richtigen bei Pick-Correct.',                                    'rp_badge_almost',        'pick_correct_exactly_3 >= 1'),
  ('panic_pick',      'Alles falsch',           '0 Richtige in einer Pick-Correct-Runde.',                                      'rp_badge_panic_pick',    'pick_correct_zero_correct >= 1'),
  ('clutch',          'Clutch',                 'Von hinten auf Platz 1 in einer Runde/Session.',                                'rp_badge_clutch',        'came_from_behind_win >= 1'),
  ('rematch',         'Nochmal!',               'Direkt nach einem Spiel ein Rematch gestartet.',                                'rp_badge_rematch',       'rematch_started >= 1'),
  ('full_lobby',      'Volle Hütte',            'Spiel mit maximaler Spieleranzahl gestartet.',                                  'rp_badge_full_lobby',    'players_at_start == max_players'),
  ('night_owl',       'Nachtschicht',           'Spiel zwischen 00:00 und 05:00 (User-Lokalzeit) beendet.',                     'rp_badge_night_owl',     'finished_hour in 0..4'),
  ('games_10',        'Stammgast',              '10 Spiele beendet.',                                                            'rp_badge_games_10',      'games_finished >= 10'),
  ('wins_5',          'Gewohnheitstäter',       '5 Siege.',                                                                      'rp_badge_wins_5',        'wins >= 5'),
  ('exact_10',        'Zahlenflüsterer',        '10 exakte Schätz-Treffer insgesamt.',                                           'rp_badge_exact_10',      'number_guess_exact_hits >= 10'),
  ('perfect_10',      'Pick-Profi',             '10 perfekte Pick-Correct-Runden insgesamt.',                                    'rp_badge_perfect_10',    'pick_correct_perfect_rounds >= 10')
ON CONFLICT (id) DO NOTHING;

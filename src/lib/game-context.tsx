"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type DbRoom,
  type DbPlayer,
  type DbAnswer,
  type DbMatchBlock,
  type DbPickCorrectTurn,
} from "./supabase";
import {
  fetchRandomThemeOptions,
  fetchPromptsForBlock,
  type Theme,
  type Prompt,
} from "./content";
import {
  generateBlockModes,
  calculateNumberGuessPoints,
  calculatePickCorrectPoints,
} from "./game-store";
import { useAuth } from "./auth-context";
import { useAchievementGrant } from "./use-achievement-grant";
import { generateGuestName } from "./guest-name";

export type GamePhase =
  | "home"
  | "lobby"
  | "theme_pick"
  | "playing_loading"
  | "number_guess"
  | "number_guess_waiting"
  | "number_guess_reveal"
  | "pick_correct"
  | "block_scoreboard"
  | "final";

const AVATARS = [
  "🦊", "🐻", "🐼", "🦁", "🐸", "🐵",
  "🐷", "🐮", "🐔", "🦄", "🐲", "🐙",
];

const REVEAL_HOLD_MS = 1000;

interface GameContextValue {
  phase: GamePhase;
  room: DbRoom | null;
  players: DbPlayer[];
  myPlayerId: string | null;
  isHost: boolean;
  error: string | null;
  loading: boolean;
  restoring: boolean;
  disconnected: boolean;
  getAvatar: (playerId: string) => string;

  // Block state
  blocks: DbMatchBlock[];
  currentBlock: DbMatchBlock | null;
  currentPrompt: Prompt | null;
  prompts: Prompt[];
  themeOptions: Theme[];

  // number_guess state
  roundAnswers: DbAnswer[];
  allBlockAnswers: DbAnswer[];

  // pick_correct state
  turns: DbPickCorrectTurn[];
  activePlayerIndex: number;
  isMyTurn: boolean;

  // theme picker
  themePickerPlayerId: string | null;
  isThemePicker: boolean;

  // Actions
  createRoom: (hostName: string, hostUserId: string) => Promise<void>;
  joinRoom: (code: string, displayName: string) => Promise<string | null>;
  leaveRoom: () => Promise<void>;
  startGame: () => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  submitNumberGuess: (guess: number) => Promise<void>;
  tapCard: (cardIndex: number) => Promise<void>;
  advanceFromReveal: () => Promise<void>;
  advanceFromBlockScore: () => Promise<void>;
  resetGame: () => Promise<void>;
  goHome: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function GameProvider({ children, joinCode }: { children: ReactNode; joinCode?: string }) {
  const { user } = useAuth();
  const { tryUnlock } = useAchievementGrant();
  const router = useRouter();
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [blocks, setBlocks] = useState<DbMatchBlock[]>([]);
  const [allAnswers, setAllAnswers] = useState<DbAnswer[]>([]);
  const [turns, setTurns] = useState<DbPickCorrectTurn[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [themeOptions, setThemeOptions] = useState<Theme[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!JSON.parse(sessionStorage.getItem("ratepanik-session") || "{}").roomId;
    } catch {
      return false;
    }
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastStateKeyRef = useRef("");
  const pickCompleteRef = useRef<string | null>(null);
  const subscribeRef = useRef<((roomId: string) => void) | null>(null);
  const sessionRestoringRef = useRef(false);
  const joinCodeUsedRef = useRef(false);
  const [disconnected, setDisconnected] = useState(false);
  const myPlayerIdRef = useRef<string | null>(null);
  const [revealHoldActive, setRevealHoldActive] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- derived state ---

  const currentBlock = useMemo(() => {
    if (!room) return null;
    return blocks.find((b) => b.block_index === room.current_block_index) ?? null;
  }, [room, blocks]);

  const currentPrompt = useMemo(() => {
    if (!currentBlock || !prompts.length) return null;
    if (currentBlock.mode === "number_guess") {
      return prompts[currentBlock.current_round] ?? null;
    }
    return prompts[0] ?? null;
  }, [currentBlock, prompts]);

  const roundAnswers = useMemo(() => {
    if (!currentBlock) return [];
    return allAnswers.filter(
      (a) =>
        a.block_index === currentBlock.block_index &&
        a.round_index === currentBlock.current_round
    );
  }, [allAnswers, currentBlock]);

  const allBlockAnswers = useMemo(() => {
    if (!currentBlock) return [];
    return allAnswers.filter((a) => a.block_index === currentBlock.block_index);
  }, [allAnswers, currentBlock]);

  const blockTurns = useMemo(() => {
    if (!currentBlock) return [];
    return turns
      .filter((t) => t.block_index === currentBlock.block_index)
      .sort((a, b) => a.turn_order - b.turn_order);
  }, [turns, currentBlock]);

  const correctTurnsCount = useMemo(
    () => blockTurns.filter((t) => t.is_correct).length,
    [blockTurns]
  );

  const sortedPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [players]
  );

  const activePlayerIndex = useMemo(() => {
    if (!currentBlock || currentBlock.mode !== "pick_correct" || !sortedPlayers.length) return 0;
    return blockTurns.length % sortedPlayers.length;
  }, [currentBlock, blockTurns.length, sortedPlayers.length]);

  const isMyTurn = useMemo(() => {
    if (!myPlayerId || !sortedPlayers.length) return false;
    return sortedPlayers[activePlayerIndex]?.id === myPlayerId;
  }, [myPlayerId, sortedPlayers, activePlayerIndex]);

  const themePickerPlayerId = useMemo(() => {
    if (!room || !sortedPlayers.length) return null;
    return sortedPlayers[room.current_block_index % sortedPlayers.length]?.id ?? null;
  }, [room, sortedPlayers]);

  const isThemePicker = themePickerPlayerId === myPlayerId;

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.is_host ?? false;

  const phase: GamePhase = useMemo(() => {
    if (!room) return restoring ? "playing_loading" : "home";
    if (room.status === "lobby") return "lobby";
    if (room.status === "finished") return "final";

    if (room.theme_vote_active) return "theme_pick";

    if (!currentBlock) return "playing_loading";

    if (currentBlock.is_complete && !(revealHoldActive && currentBlock.mode === "pick_correct")) {
      return "block_scoreboard";
    }

    if (currentBlock.mode === "number_guess") {
      if (roundAnswers.length >= players.length && players.length > 0) {
        return "number_guess_reveal";
      }
      const myAnswer = roundAnswers.find((a) => a.player_id === myPlayerId);
      if (myAnswer) return "number_guess_waiting";
      return "number_guess";
    }

    if (currentBlock.mode === "pick_correct") {
      if (correctTurnsCount >= 4 && !revealHoldActive) return "block_scoreboard";
      return "pick_correct";
    }

    return "playing_loading";
  }, [room, currentBlock, roundAnswers, players.length, myPlayerId, correctTurnsCount, restoring, revealHoldActive]);

  const getAvatar = useCallback(
    (playerId: string) => {
      const index = sortedPlayers.findIndex((p) => p.id === playerId);
      return AVATARS[(index >= 0 ? index : 0) % AVATARS.length];
    },
    [sortedPlayers]
  );

  useEffect(() => { myPlayerIdRef.current = myPlayerId; }, [myPlayerId]);

  // --- auto-clear errors ---

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // --- realtime subscription ---

  const subscribeToRoom = useCallback((roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setRoom(payload.new as DbRoom);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlayers((prev) => {
              if (prev.some((p) => p.id === (payload.new as DbPlayer).id)) return prev;
              return [...prev, payload.new as DbPlayer];
            });
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === (payload.new as DbPlayer).id ? (payload.new as DbPlayer) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            const leftPlayerId = (payload.old as { id: string }).id;
            setPlayers((prev) => {
              if (leftPlayerId !== myPlayerIdRef.current) {
                const leftPlayer = prev.find((p) => p.id === leftPlayerId);
                if (leftPlayer) {
                  queueMicrotask(() =>
                    setError(`${leftPlayer.display_name} hat das Spiel verlassen.`)
                  );
                }
              }
              return prev.filter((p) => p.id !== leftPlayerId);
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_blocks", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBlocks((prev) => {
              const nb = payload.new as DbMatchBlock;
              if (prev.some((b) => b.id === nb.id)) return prev;
              return [...prev, nb];
            });
          } else if (payload.eventType === "UPDATE") {
            setBlocks((prev) =>
              prev.map((b) =>
                b.id === (payload.new as DbMatchBlock).id ? (payload.new as DbMatchBlock) : b
              )
            );
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAllAnswers((prev) => {
            const na = payload.new as DbAnswer;
            if (prev.some((a) => a.id === na.id)) return prev;
            return [...prev, na];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAllAnswers((prev) =>
            prev.map((a) =>
              a.id === (payload.new as DbAnswer).id ? (payload.new as DbAnswer) : a
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pick_correct_turns", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setTurns((prev) => {
            const nt = payload.new as DbPickCorrectTurn;
            if (prev.some((t) => t.id === nt.id)) return prev;
            return [...prev, nt];
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setDisconnected(false);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setDisconnected(true);
          console.warn("Realtime subscription issue:", status, err);
          setTimeout(() => {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
            }
            subscribeRef.current?.(roomId);
          }, 2000);
        }
      });

    channelRef.current = channel;
  }, []);

  useEffect(() => {
    subscribeRef.current = subscribeToRoom;
  }, [subscribeToRoom]);

  // --- load prompts when block theme is selected ---

  useEffect(() => {
    if (!currentBlock?.theme_id || !currentBlock.prompt_ids?.length) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("prompts")
        .select("id, theme_id, mode, difficulty, prompt, hint, payload")
        .in("id", currentBlock.prompt_ids);

      if (cancelled || !data) return;

      const ordered = currentBlock.prompt_ids
        .map((pid) => data.find((p) => p.id === pid))
        .filter((p): p is Prompt => p !== undefined);

      setPrompts(ordered);
    })();

    return () => { cancelled = true; };
  }, [currentBlock?.theme_id, currentBlock?.prompt_ids]);

  // --- load theme options when theme_vote_active ---

  useEffect(() => {
    if (!room?.theme_vote_active || !currentBlock?.theme_options?.length) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("themes")
        .select("id, slug, name_de")
        .in("id", currentBlock.theme_options!);

      if (cancelled || !data) return;
      setThemeOptions(data as Theme[]);
    })();

    return () => { cancelled = true; };
  }, [room?.theme_vote_active, currentBlock?.theme_options]);

  // --- reset local sub-state when block advances ---

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const key = `${room.current_block_index}:${room.theme_vote_active}`;
    if (key !== lastStateKeyRef.current) {
      lastStateKeyRef.current = key;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.current_block_index, room?.theme_vote_active]);

  // Activate ~1s reveal hold when pick_correct finds the 4th correct card,
  // keeping the card highlight visible before transitioning to scoreboard.
  const prevPickCorrectDoneRef = useRef(false);
  useEffect(() => {
    const done =
      !!currentBlock &&
      currentBlock.mode === "pick_correct" &&
      !currentBlock.is_complete &&
      correctTurnsCount >= 4;

    if (done && !prevPickCorrectDoneRef.current) {
      queueMicrotask(() => setRevealHoldActive(true));
      revealTimerRef.current = setTimeout(() => {
        setRevealHoldActive(false);
        revealTimerRef.current = null;
      }, REVEAL_HOLD_MS);
    }

    prevPickCorrectDoneRef.current = done;

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [correctTurnsCount, currentBlock]);

  // Handle pick_correct auto-complete: when 4 correct found, host marks block complete
  useEffect(() => {
    if (!isHost || !currentBlock || currentBlock.mode !== "pick_correct") return;
    if (currentBlock.is_complete) return;
    if (correctTurnsCount < 4) return;
    if (revealHoldActive) return;
    const completeKey = `${currentBlock.id}`;
    if (pickCompleteRef.current === completeKey) return;
    pickCompleteRef.current = completeKey;

    (async () => {
      // Calculate scores for pick_correct
      const playerCorrects = new Map<string, number>();
      for (const t of blockTurns) {
        if (t.is_correct) {
          playerCorrects.set(t.player_id, (playerCorrects.get(t.player_id) ?? 0) + 1);
        }
      }

      // Award points and update player scores
      for (const player of players) {
        const found = playerCorrects.get(player.id) ?? 0;
        const pts = calculatePickCorrectPoints(found);

        await supabase.from("match_scores").upsert(
          {
            room_id: room!.id,
            player_id: player.id,
            block_index: currentBlock.block_index,
            total_points: pts,
          },
          { onConflict: "room_id,player_id,block_index" }
        );

        await supabase
          .from("players")
          .update({ score: player.score + pts })
          .eq("id", player.id);
      }

      await supabase
        .from("match_blocks")
        .update({
          is_complete: true,
          finished_at: new Date().toISOString(),
        })
        .eq("id", currentBlock.id);
    })();
  }, [isHost, currentBlock, correctTurnsCount, blockTurns, players, room, revealHoldActive]);

  // --- session persistence ---

  function saveSession(roomId: string, playerId: string) {
    sessionStorage.setItem(
      "ratepanik-session",
      JSON.stringify({ roomId, playerId })
    );
  }

  function clearSession() {
    sessionStorage.removeItem("ratepanik-session");
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("ratepanik-session");
    if (!raw) return;
    let cancelled = false;
    sessionRestoringRef.current = true;
    (async () => {
      try {
        const { roomId, playerId } = JSON.parse(raw);
        const [{ data: roomData }, { data: playerData }] = await Promise.all([
          supabase.from("rooms").select().eq("id", roomId).single(),
          supabase.from("players").select().eq("id", playerId).single(),
        ]);
        if (cancelled) return;
        if (!roomData || !playerData) {
          clearSession();
          setRestoring(false);
          return;
        }
        const [
          { data: playersData },
          { data: answersData },
          { data: blocksData },
          { data: turnsData },
        ] = await Promise.all([
          supabase.from("players").select().eq("room_id", roomId),
          supabase.from("answers").select().eq("room_id", roomId),
          supabase.from("match_blocks").select().eq("room_id", roomId),
          supabase.from("pick_correct_turns").select().eq("room_id", roomId),
        ]);
        if (cancelled) return;
        setRoom(roomData);
        setPlayers(playersData || []);
        setAllAnswers(answersData || []);
        setBlocks(blocksData || []);
        setTurns(turnsData || []);
        setMyPlayerId(playerId);
        subscribeToRoom(roomId);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setRestoring(false);
        sessionRestoringRef.current = false;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- actions ---

  const createRoom = async (hostName: string, hostUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateRoomCode();

      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .insert({ code, host_user_id: hostUserId })
        .select()
        .single();

      if (roomErr) {
        if (roomErr.code === "23505") {
          setLoading(false);
          return createRoom(hostName, hostUserId);
        }
        throw roomErr;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({
          room_id: roomData.id,
          user_id: hostUserId,
          display_name: hostName,
          is_host: true,
        })
        .select()
        .single();

      if (playerErr) throw playerErr;

      setRoom(roomData);
      setPlayers([playerData]);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
      setBlocks([]);
      setTurns([]);
      setPrompts([]);

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);

      void tryUnlock("first_room");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler beim Erstellen des Raums";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, displayName: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const uid = user?.id ?? null;

      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .select()
        .eq("code", code.toUpperCase().trim())
        .single();

      if (roomErr || !roomData) {
        const m = "Raum nicht gefunden. Prüfe den Code!";
        setError(m);
        return m;
      }

      const { data: existingPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      // Check if this user is already a player in the room (rejoin scenario)
      const stored = sessionStorage.getItem("ratepanik-session");
      let existingPlayer: DbPlayer | null = null;
      if (stored) {
        try {
          const { playerId } = JSON.parse(stored);
          existingPlayer = existingPlayers?.find((p) => p.id === playerId) ?? null;
        } catch { /* ignore parse errors */ }
      }

      if (existingPlayer) {
        // Rejoin: player already exists in this room — restore state
        const [
          { data: answersData },
          { data: blocksData },
          { data: turnsData },
        ] = await Promise.all([
          supabase.from("answers").select().eq("room_id", roomData.id),
          supabase.from("match_blocks").select().eq("room_id", roomData.id),
          supabase.from("pick_correct_turns").select().eq("room_id", roomData.id),
        ]);

        setRoom(roomData);
        setPlayers(existingPlayers || []);
        setMyPlayerId(existingPlayer.id);
        setAllAnswers(answersData || []);
        setBlocks(blocksData || []);
        setTurns(turnsData || []);
        setPrompts([]);

        saveSession(roomData.id, existingPlayer.id);
        subscribeToRoom(roomData.id);
        return null;
      }

      if (roomData.status !== "lobby") {
        const m = "Das Spiel läuft bereits!";
        setError(m);
        return m;
      }

      let playerData: DbPlayer;

      // Rejoin: reuse existing player row for this auth user in this room
      if (uid) {
        const { data: existing } = await supabase
          .from("players")
          .select()
          .eq("room_id", roomData.id)
          .eq("user_id", uid)
          .maybeSingle();

        if (existing) {
          const { data: updated, error: updateErr } = await supabase
            .from("players")
            .update({
              display_name: displayName,
              last_seen_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateErr) throw updateErr;
          playerData = updated;
        } else {
          // New join — check capacity first
          const { data: existingPlayers } = await supabase
            .from("players")
            .select()
            .eq("room_id", roomData.id);

          if ((existingPlayers?.length ?? 0) >= 4) {
            const m = "Raum ist voll (max 4 Spieler)!";
            setError(m);
            return m;
          }

          const { data: inserted, error: insertErr } = await supabase
            .from("players")
            .insert({
              room_id: roomData.id,
              user_id: uid,
              display_name: displayName,
              is_host: false,
            })
            .select()
            .single();

          if (insertErr) throw insertErr;
          playerData = inserted;
        }
      } else {
        // Context user not yet loaded — resolve directly from Supabase Auth
        // so anon-auth guests still get user_id set on their player row.
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        const fallbackUid = freshUser?.id ?? null;

        const { data: existingPlayers } = await supabase
          .from("players")
          .select()
          .eq("room_id", roomData.id);

        if ((existingPlayers?.length ?? 0) >= 4) {
          const m = "Raum ist voll (max 4 Spieler)!";
          setError(m);
          return m;
        }

        const { data: inserted, error: insertErr } = await supabase
          .from("players")
          .insert({
            room_id: roomData.id,
            user_id: fallbackUid,
            display_name: displayName,
            is_host: false,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;
        playerData = inserted;
      }

      const { data: allPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      setRoom(roomData);
      setPlayers(allPlayers || []);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
      setBlocks([]);
      setTurns([]);
      setPrompts([]);

      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);
      return null;
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : "Fehler beim Beitreten";
      setError(m);
      return m;
    } finally {
      setLoading(false);
    }
  };

  // Auto-join from ?join=CODE query param (landing guest flow)
  useEffect(() => {
    if (!joinCode || joinCodeUsedRef.current || room) return;
    // Defer auto-join if session restoration is in progress
    if (sessionRestoringRef.current) return;
    joinCodeUsedRef.current = true;
    const autoName =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      generateGuestName();
    void joinRoom(joinCode, autoName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinCode, room]);

  const startGame = async () => {
    if (!room || !isHost) return;

    const modes = generateBlockModes(4);

    // Create match blocks
    const blockInserts = modes.map((mode, i) => ({
      room_id: room.id,
      block_index: i,
      mode,
      rounds_total: mode === "number_guess" ? 2 : 1,
    }));

    const { data: blocksData, error: blocksErr } = await supabase
      .from("match_blocks")
      .insert(blockInserts)
      .select();

    if (blocksErr) {
      setError(blocksErr.message);
      return;
    }

    setBlocks(blocksData || []);

    // Get 2 random themes for first block
    const themes = await fetchRandomThemeOptions(2);
    const themeIds = themes.map((t) => t.id);

    // Update first block with theme options
    if (blocksData?.[0]) {
      await supabase
        .from("match_blocks")
        .update({ theme_options: themeIds })
        .eq("id", blocksData[0].id);
    }

    // Clean up old answers/scores
    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("pick_correct_turns").delete().eq("room_id", room.id);
    await supabase.from("match_scores").delete().eq("room_id", room.id);
    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);

    // Start match
    const { error: upErr } = await supabase
      .from("rooms")
      .update({
        status: "playing" as const,
        current_block_index: 0,
        theme_vote_active: true,
        current_question_index: 0,
        question_ids: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    if (upErr) {
      setError(upErr.message);
      return;
    }

    setAllAnswers([]);
    setTurns([]);
    lastStateKeyRef.current = "0:true";
  };

  const selectTheme = async (themeId: string) => {
    if (!room || !currentBlock) return;

    // Fetch prompts for this theme + mode
    const count = currentBlock.mode === "number_guess" ? 2 : 1;
    let fetchedPrompts = await fetchPromptsForBlock(themeId, currentBlock.mode, count);

    // Fallback: if no prompts for selected theme+mode, try other themes
    if (fetchedPrompts.length === 0) {
      const allThemes = await fetchRandomThemeOptions(8);
      for (const fallbackTheme of allThemes) {
        if (fallbackTheme.id === themeId) continue;
        fetchedPrompts = await fetchPromptsForBlock(fallbackTheme.id, currentBlock.mode, count);
        if (fetchedPrompts.length > 0) break;
      }
    }

    if (fetchedPrompts.length === 0) {
      setError("Keine Fragen verfügbar. Bitte Fragemeister kontaktieren.");
      return;
    }

    const promptIds = fetchedPrompts.map((p) => p.id);
    setPrompts(fetchedPrompts);

    // Update block with selected theme and prompts
    await supabase
      .from("match_blocks")
      .update({
        theme_id: themeId,
        prompt_ids: promptIds,
        started_at: new Date().toISOString(),
      })
      .eq("id", currentBlock.id);

    // Deactivate theme vote
    await supabase
      .from("rooms")
      .update({
        theme_vote_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  };

  const submitNumberGuess = async (guess: number) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt) return;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      block_index: currentBlock.block_index,
      round_index: currentBlock.current_round,
      prompt_id: currentPrompt.id,
      mode: "number_guess",
      numeric_answer: guess,
      question_index: room.current_block_index * 10 + currentBlock.current_round,
      choice_index: -1,
      is_correct: null,
    });

    if (ansErr && ansErr.code !== "23505") {
      setError("Konnte nicht senden. Nochmal tippen?");
      throw new Error(ansErr.message);
    }
  };

  const tapCard = async (cardIndex: number) => {
    if (!room || !myPlayerId || !currentBlock || !currentPrompt || !isMyTurn) return;

    // Check if card already tapped
    if (blockTurns.some((t) => t.card_index === cardIndex)) return;

    const payload = currentPrompt.payload as { cards: string[]; correct_indices: number[] };
    const isCorrect = payload.correct_indices.includes(cardIndex);

    const { error: tapErr } = await supabase.from("pick_correct_turns").insert({
      room_id: room.id,
      block_index: currentBlock.block_index,
      player_id: myPlayerId,
      turn_order: blockTurns.length,
      card_index: cardIndex,
      is_correct: isCorrect,
    });

    if (tapErr) {
      setError("Konnte nicht senden. Nochmal tippen?");
    }
  };

  const advanceFromReveal = async () => {
    if (!room || !isHost || !currentBlock) return;

    // Calculate rankings for current round
    const correctAnswer = (currentPrompt?.payload as { answer: number })?.answer;
    if (correctAnswer !== undefined) {
      const answersForRound = roundAnswers.map((a) => ({
        ...a,
        dist: Math.abs((a.numeric_answer ?? 0) - correctAnswer),
      }));
      answersForRound.sort((a, b) => a.dist - b.dist);

      // Assign ranks and points
      for (let i = 0; i < answersForRound.length; i++) {
        const a = answersForRound[i];
        const rank = i + 1;
        const pts = calculateNumberGuessPoints(rank, answersForRound.length);

        await supabase
          .from("answers")
          .update({
            distance: a.dist,
            rank,
            points_awarded: pts,
          })
          .eq("id", a.id);

        // Update player score
        const player = players.find((p) => p.id === a.player_id);
        if (player) {
          await supabase
            .from("players")
            .update({ score: player.score + pts })
            .eq("id", player.id);
        }
      }
    }

    // Check if more rounds in this block
    const nextRound = currentBlock.current_round + 1;
    if (nextRound < currentBlock.rounds_total) {
      await supabase
        .from("match_blocks")
        .update({ current_round: nextRound })
        .eq("id", currentBlock.id);
    } else {
      // Block complete
      // Upsert match_scores for this block
      for (const player of players) {
        const blockPts = allBlockAnswers
          .filter((a) => a.player_id === player.id)
          .reduce((sum, a) => sum + (a.points_awarded || 0), 0);

        await supabase.from("match_scores").upsert(
          {
            room_id: room.id,
            player_id: player.id,
            block_index: currentBlock.block_index,
            total_points: blockPts,
          },
          { onConflict: "room_id,player_id,block_index" }
        );
      }

      await supabase
        .from("match_blocks")
        .update({
          is_complete: true,
          finished_at: new Date().toISOString(),
        })
        .eq("id", currentBlock.id);
    }
  };

  const advanceFromBlockScore = async () => {
    if (!room || !isHost) return;

    const nextBlockIndex = room.current_block_index + 1;

    if (nextBlockIndex >= room.total_blocks) {
      // Match finished
      await supabase
        .from("rooms")
        .update({
          status: "finished" as const,
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);
      return;
    }

    // Set up next block's theme options
    const nextBlock = blocks.find((b) => b.block_index === nextBlockIndex);
    if (nextBlock) {
      const themes = await fetchRandomThemeOptions(2);
      const themeIds = themes.map((t) => t.id);

      await supabase
        .from("match_blocks")
        .update({ theme_options: themeIds })
        .eq("id", nextBlock.id);
    }

    // Advance to next block
    await supabase
      .from("rooms")
      .update({
        current_block_index: nextBlockIndex,
        theme_vote_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    setPrompts([]);
  };

  const resetGame = async () => {
    if (!room) return;

    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("pick_correct_turns").delete().eq("room_id", room.id);
    await supabase.from("match_scores").delete().eq("room_id", room.id);
    await supabase.from("match_blocks").delete().eq("room_id", room.id);
    await supabase
      .from("players")
      .update({ score: 0 })
      .eq("room_id", room.id);
    await supabase
      .from("rooms")
      .update({
        status: "lobby" as const,
        current_block_index: 0,
        theme_vote_active: false,
        current_question_index: 0,
        question_ids: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    setAllAnswers([]);
    setBlocks([]);
    setTurns([]);
    setPrompts([]);
    setThemeOptions([]);
    lastStateKeyRef.current = "";
  };

  const leaveRoom = async () => {
    if (!room || !myPlayerId) {
      goHome();
      return;
    }

    const roomId = room.id;
    const playerId = myPlayerId;

    try {
      await supabase
        .from("answers")
        .delete()
        .eq("player_id", playerId)
        .eq("room_id", roomId);

      await supabase.from("players").delete().eq("id", playerId);
    } catch (e) {
      console.error("leaveRoom cleanup error:", e);
    }

    goHome();
  };

  const goHome = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
    setAllAnswers([]);
    setBlocks([]);
    setTurns([]);
    setMyPlayerId(null);
    setPrompts([]);
    setThemeOptions([]);
    setError(null);
    lastStateKeyRef.current = "";
    clearSession();

    if (typeof window !== "undefined" && window.location.search.includes("join=")) {
      router.replace("/");
    }
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const value: GameContextValue = {
    phase,
    room,
    players,
    myPlayerId,
    isHost,
    error,
    loading,
    restoring,
    disconnected,
    getAvatar,
    blocks,
    currentBlock,
    currentPrompt,
    prompts,
    themeOptions,
    roundAnswers,
    allBlockAnswers,
    turns: blockTurns,
    activePlayerIndex,
    isMyTurn,
    themePickerPlayerId,
    isThemePicker,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    selectTheme,
    submitNumberGuess,
    tapCard,
    advanceFromReveal,
    advanceFromBlockScore,
    resetGame,
    goHome,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

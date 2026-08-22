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
import { supabase, type DbRoom, type DbPlayer, type DbAnswer } from "./supabase";
import { fetchActiveThemes, fetchPromptsForBlock, type Theme, type Prompt } from "./content";

export type GamePhase =
  | "home"
  | "lobby"
  | "theme_select"
  | "question"
  | "answered"
  | "reveal"
  | "scoreboard"
  | "final";

export type GameMode = "number_guess" | "pick_correct";

export interface MatchBlock {
  index: number;
  mode: GameMode;
  themeId: string | null;
  themeName: string | null;
  prompts: Prompt[];
  currentRound: number;
}

const AVATARS = [
  "🦊", "🐻", "🐼", "🦁", "🐸", "🐵",
  "🐷", "🐮", "🐔", "🦄", "🐲", "🐙",
];

export const TIME_PER_QUESTION = 20;
const BLOCKS_TOTAL = 4;
const ROUNDS_PER_BLOCK = 2;
const MODES: GameMode[] = ["number_guess", "pick_correct"];

interface GameContextValue {
  phase: GamePhase;
  room: DbRoom | null;
  players: DbPlayer[];
  currentBlock: MatchBlock | null;
  currentPrompt: Prompt | null;
  currentBlockIndex: number;
  currentRoundInBlock: number;
  totalBlocks: number;
  myPlayerId: string | null;
  isHost: boolean;
  answers: DbAnswer[];
  lastRoundPoints: number;
  timePerQuestion: number;
  error: string | null;
  loading: boolean;
  themeOptions: Theme[];
  mode: GameMode | null;
  getAvatar: (playerId: string) => string;

  createRoom: (hostName: string) => Promise<void>;
  joinRoom: (code: string, displayName: string) => Promise<string | null>;
  startGame: () => Promise<void>;
  selectTheme: (themeId: string) => Promise<void>;
  submitNumberGuess: (guess: number, timeMs: number) => Promise<void>;
  submitPickCorrectCard: (cardIndex: number) => Promise<void>;
  showReveal: () => void;
  showScoreboard: () => void;
  nextRound: () => Promise<void>;
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

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [players, setPlayers] = useState<DbPlayer[]>([]);
  const [allAnswers, setAllAnswers] = useState<DbAnswer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [subPhase, setSubPhase] = useState<
    "theme_select" | "question" | "answered" | "reveal" | "scoreboard"
  >("question");
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [blocks, setBlocks] = useState<MatchBlock[]>([]);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentRoundInBlock, setCurrentRoundInBlock] = useState(0);
  const [themeOptions, setThemeOptions] = useState<Theme[]>([]);
  const [allThemes, setAllThemes] = useState<Theme[]>([]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSeenQuestionKeyRef = useRef("");

  const currentBlock = blocks[currentBlockIndex] ?? null;
  const currentPrompt = currentBlock?.prompts[currentRoundInBlock] ?? null;
  const mode = currentBlock?.mode ?? null;

  const currentAnswers = useMemo(
    () => allAnswers.filter(
      (a) => a.question_index === currentBlockIndex * ROUNDS_PER_BLOCK + currentRoundInBlock
    ),
    [allAnswers, currentBlockIndex, currentRoundInBlock]
  );

  const myPlayer = players.find((p) => p.id === myPlayerId);
  const isHost = myPlayer?.is_host ?? false;

  const phase: GamePhase = useMemo(() => {
    if (!room) return "home";
    if (room.status === "lobby") return "lobby";
    if (room.status === "finished") return "final";
    if (subPhase === "theme_select") return "theme_select";
    if (
      (subPhase === "question" || subPhase === "answered") &&
      players.length > 0 &&
      currentAnswers.length >= players.length
    ) {
      return "reveal";
    }
    return subPhase;
  }, [room, subPhase, players.length, currentAnswers.length]);

  const getAvatar = useCallback(
    (playerId: string) => {
      const sorted = [...players].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const index = sorted.findIndex((p) => p.id === playerId);
      return AVATARS[(index >= 0 ? index : 0) % AVATARS.length];
    },
    [players]
  );

  // Load themes on mount
  useEffect(() => {
    fetchActiveThemes().then(setAllThemes);
  }, []);

  // Auto-clear errors
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // Realtime subscription
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
              prev.map((p) => p.id === (payload.new as DbPlayer).id ? (payload.new as DbPlayer) : p)
            );
          } else if (payload.eventType === "DELETE") {
            setPlayers((prev) => prev.filter((p) => p.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAllAnswers((prev) => {
            if (prev.some((a) => a.id === (payload.new as DbAnswer).id)) return prev;
            return [...prev, payload.new as DbAnswer];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  // Session persistence
  function saveSession(roomId: string, playerId: string) {
    sessionStorage.setItem("ratepanik-session", JSON.stringify({ roomId, playerId }));
  }

  function clearSession() {
    sessionStorage.removeItem("ratepanik-session");
  }

  useEffect(() => {
    const raw = sessionStorage.getItem("ratepanik-session");
    if (!raw) return;
    let cancelled = false;
    (async () => {
      try {
        const { roomId, playerId } = JSON.parse(raw);
        const [{ data: roomData }, { data: playerData }] = await Promise.all([
          supabase.from("rooms").select().eq("id", roomId).single(),
          supabase.from("players").select().eq("id", playerId).single(),
        ]);
        if (cancelled || !roomData || !playerData) { clearSession(); return; }
        const [{ data: playersData }, { data: answersData }] = await Promise.all([
          supabase.from("players").select().eq("room_id", roomId),
          supabase.from("answers").select().eq("room_id", roomId),
        ]);
        if (cancelled) return;
        setRoom(roomData);
        setPlayers(playersData || []);
        setAllAnswers(answersData || []);
        setMyPlayerId(playerId);
        subscribeToRoom(roomId);
      } catch {
        if (!cancelled) clearSession();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync phase from room status changes
  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const key = `${room.status}:${room.current_question_index}`;
    if (key !== lastSeenQuestionKeyRef.current) {
      lastSeenQuestionKeyRef.current = key;
      setLastRoundPoints(0);
    }
  }, [room?.status, room?.current_question_index]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Actions ---

  const createRoom = async (hostName: string) => {
    setLoading(true);
    setError(null);
    try {
      const code = generateRoomCode();
      const { data: roomData, error: roomErr } = await supabase
        .from("rooms")
        .insert({ code })
        .select()
        .single();

      if (roomErr) {
        if (roomErr.code === "23505") { setLoading(false); return createRoom(hostName); }
        throw roomErr;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({ room_id: roomData.id, display_name: hostName, is_host: true })
        .select()
        .single();

      if (playerErr) throw playerErr;

      setRoom(roomData);
      setPlayers([playerData]);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
      saveSession(roomData.id, playerData.id);
      subscribeToRoom(roomData.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Raums");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, displayName: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
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
      if (roomData.status !== "lobby") {
        const m = "Das Spiel läuft bereits!";
        setError(m);
        return m;
      }

      const { data: existingPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      if ((existingPlayers?.length ?? 0) >= 4) {
        const m = "Raum ist voll (max. 4 Spieler)!";
        setError(m);
        return m;
      }

      const { data: playerData, error: playerErr } = await supabase
        .from("players")
        .insert({ room_id: roomData.id, display_name: displayName, is_host: false })
        .select()
        .single();

      if (playerErr) throw playerErr;

      const { data: allPlayers } = await supabase
        .from("players")
        .select()
        .eq("room_id", roomData.id);

      setRoom(roomData);
      setPlayers(allPlayers || []);
      setMyPlayerId(playerData.id);
      setAllAnswers([]);
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

  const startGame = async () => {
    if (!room || !isHost) return;

    // Assign modes to blocks (alternate, shuffled)
    const shuffledModes = shuffleArray([...MODES, ...MODES]) as GameMode[];
    const newBlocks: MatchBlock[] = shuffledModes.slice(0, BLOCKS_TOTAL).map((mode, i) => ({
      index: i,
      mode,
      themeId: null,
      themeName: null,
      prompts: [],
      currentRound: 0,
    }));

    setBlocks(newBlocks);
    setCurrentBlockIndex(0);
    setCurrentRoundInBlock(0);
    setAllAnswers([]);

    // Clear old answers and reset scores
    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("players").update({ score: 0 }).eq("room_id", room.id);

    // Update room status
    await supabase
      .from("rooms")
      .update({
        status: "playing" as const,
        current_question_index: 0,
        question_ids: shuffledModes as unknown as number[],
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    // Present theme selection for first block
    presentThemeOptions();
  };

  function presentThemeOptions() {
    if (allThemes.length < 2) {
      setError("Nicht genügend Themen verfügbar.");
      return;
    }
    const shuffled = shuffleArray(allThemes);
    setThemeOptions(shuffled.slice(0, 2));
    setSubPhase("theme_select");
  }

  const selectTheme = async (themeId: string) => {
    if (!room || !currentBlock) return;

    const theme = allThemes.find((t) => t.id === themeId);
    if (!theme) return;

    // Fetch prompts for this block's mode + selected theme
    const prompts = await fetchPromptsForBlock(themeId, currentBlock.mode, ROUNDS_PER_BLOCK);

    if (prompts.length === 0) {
      setError("Keine Fragen für dieses Thema verfügbar. Versuche ein anderes.");
      return;
    }

    const updatedBlocks = [...blocks];
    updatedBlocks[currentBlockIndex] = {
      ...currentBlock,
      themeId,
      themeName: theme.name_de,
      prompts,
    };
    setBlocks(updatedBlocks);
    setCurrentRoundInBlock(0);
    setSubPhase("question");
    lastSeenQuestionKeyRef.current = `playing:${currentBlockIndex}:0`;
  };

  const submitNumberGuess = async (guess: number, _timeMs: number) => {
    if (!room || !myPlayerId || !currentPrompt) return;

    const payload = currentPrompt.payload as { answer: number };
    const correctAnswer = payload.answer;
    const distance = Math.abs(guess - correctAnswer);

    const questionIndex = currentBlockIndex * ROUNDS_PER_BLOCK + currentRoundInBlock;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      question_index: questionIndex,
      choice_index: Math.round(guess),
      is_correct: distance === 0,
    });

    if (ansErr && ansErr.code !== "23505") {
      console.error("Answer insert error:", ansErr);
      return;
    }

    setSubPhase("answered");
  };

  const submitPickCorrectCard = async (cardIndex: number) => {
    if (!room || !myPlayerId || !currentPrompt) return;

    const payload = currentPrompt.payload as { cards: string[]; correct_indices: number[] };
    const isCorrect = payload.correct_indices.includes(cardIndex);

    const questionIndex = currentBlockIndex * ROUNDS_PER_BLOCK + currentRoundInBlock;

    const { error: ansErr } = await supabase.from("answers").insert({
      room_id: room.id,
      player_id: myPlayerId,
      question_index: questionIndex,
      choice_index: cardIndex,
      is_correct: isCorrect,
    });

    if (ansErr && ansErr.code !== "23505") {
      console.error("Answer insert error:", ansErr);
      return;
    }

    setSubPhase("answered");
  };

  const showReveal = () => setSubPhase("reveal");
  const showScoreboard = () => setSubPhase("scoreboard");

  const nextRound = async () => {
    if (!room || !isHost) return;

    // Calculate points for current round
    await calculateAndAwardPoints();

    const nextRoundIdx = currentRoundInBlock + 1;

    if (nextRoundIdx < (currentBlock?.prompts.length ?? 0)) {
      // More rounds in current block
      setCurrentRoundInBlock(nextRoundIdx);
      setSubPhase("question");
      lastSeenQuestionKeyRef.current = `playing:${currentBlockIndex}:${nextRoundIdx}`;

      await supabase.from("rooms").update({
        current_question_index: currentBlockIndex * ROUNDS_PER_BLOCK + nextRoundIdx,
        updated_at: new Date().toISOString(),
      }).eq("id", room.id);
    } else {
      // Block complete — move to next block
      const nextBlockIdx = currentBlockIndex + 1;

      if (nextBlockIdx >= BLOCKS_TOTAL) {
        // Match finished
        await supabase.from("rooms").update({
          status: "finished" as const,
          updated_at: new Date().toISOString(),
        }).eq("id", room.id);
      } else {
        // Start next block with theme selection
        setCurrentBlockIndex(nextBlockIdx);
        setCurrentRoundInBlock(0);
        presentThemeOptions();

        await supabase.from("rooms").update({
          current_question_index: nextBlockIdx * ROUNDS_PER_BLOCK,
          updated_at: new Date().toISOString(),
        }).eq("id", room.id);
      }
    }
  };

  async function calculateAndAwardPoints() {
    if (!room || !currentBlock || !currentPrompt) return;

    const questionIndex = currentBlockIndex * ROUNDS_PER_BLOCK + currentRoundInBlock;
    const roundAnswers = allAnswers.filter((a) => a.question_index === questionIndex);

    if (currentBlock.mode === "number_guess") {
      const payload = currentPrompt.payload as { answer: number };
      const correctAnswer = payload.answer;

      // Rank by distance
      const ranked = roundAnswers
        .map((a) => ({
          playerId: a.player_id,
          distance: Math.abs(a.choice_index - correctAnswer),
        }))
        .sort((a, b) => a.distance - b.distance);

      for (let i = 0; i < ranked.length; i++) {
        const points = (players.length - 1 - i) * 100;
        if (points > 0) {
          const player = players.find((p) => p.id === ranked[i].playerId);
          if (player) {
            await supabase.from("players").update({
              score: player.score + points,
            }).eq("id", player.id);
          }
        }
        if (ranked[i].playerId === myPlayerId) {
          setLastRoundPoints(points);
        }
      }
    } else if (currentBlock.mode === "pick_correct") {
      const payload = currentPrompt.payload as { correct_indices: number[] };

      for (const answer of roundAnswers) {
        const isCorrect = payload.correct_indices.includes(answer.choice_index);
        const points = isCorrect ? 250 : 0;
        if (points > 0) {
          const player = players.find((p) => p.id === answer.player_id);
          if (player) {
            await supabase.from("players").update({
              score: player.score + points,
            }).eq("id", player.id);
          }
        }
        if (answer.player_id === myPlayerId) {
          setLastRoundPoints(points);
        }
      }
    }
  }

  const resetGame = async () => {
    if (!room) return;
    await supabase.from("answers").delete().eq("room_id", room.id);
    await supabase.from("players").update({ score: 0 }).eq("room_id", room.id);
    await supabase.from("rooms").update({
      status: "lobby" as const,
      current_question_index: 0,
      question_ids: [],
      updated_at: new Date().toISOString(),
    }).eq("id", room.id);

    setAllAnswers([]);
    setBlocks([]);
    setCurrentBlockIndex(0);
    setCurrentRoundInBlock(0);
    setLastRoundPoints(0);
    setThemeOptions([]);
    lastSeenQuestionKeyRef.current = "";
  };

  const goHome = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setRoom(null);
    setPlayers([]);
    setAllAnswers([]);
    setMyPlayerId(null);
    setBlocks([]);
    setCurrentBlockIndex(0);
    setCurrentRoundInBlock(0);
    setLastRoundPoints(0);
    setThemeOptions([]);
    setError(null);
    lastSeenQuestionKeyRef.current = "";
    clearSession();
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
    currentBlock,
    currentPrompt,
    currentBlockIndex,
    currentRoundInBlock,
    totalBlocks: BLOCKS_TOTAL,
    myPlayerId,
    isHost,
    answers: currentAnswers,
    lastRoundPoints,
    timePerQuestion: TIME_PER_QUESTION,
    error,
    loading,
    themeOptions,
    mode,
    getAvatar,
    createRoom,
    joinRoom,
    startGame,
    selectTheme,
    submitNumberGuess,
    submitPickCorrectCard,
    showReveal,
    showScoreboard,
    nextRound,
    resetGame,
    goHome,
  };

  return (
    <GameContext.Provider value={value}>{children}</GameContext.Provider>
  );
}

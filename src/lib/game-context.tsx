"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import {
  type GameState,
  createInitialState,
  createRoom,
  addPlayer,
  removePlayer,
  startGame,
  submitAnswer,
  revealAnswer,
  showScoreboard,
  nextQuestion,
  resetGame,
} from "./game-store";

type GameAction =
  | { type: "CREATE_ROOM"; hostName: string }
  | { type: "ADD_PLAYER"; name: string }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "START_GAME" }
  | { type: "SUBMIT_ANSWER"; playerId: string; answerIndex: number; timeMs: number }
  | { type: "REVEAL_ANSWER" }
  | { type: "SHOW_SCOREBOARD" }
  | { type: "NEXT_QUESTION" }
  | { type: "RESET_GAME" }
  | { type: "GO_HOME" };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CREATE_ROOM":
      return createRoom(state, action.hostName);
    case "ADD_PLAYER":
      return addPlayer(state, action.name);
    case "REMOVE_PLAYER":
      return removePlayer(state, action.playerId);
    case "START_GAME":
      return startGame(state);
    case "SUBMIT_ANSWER":
      return submitAnswer(state, action.playerId, action.answerIndex, action.timeMs);
    case "REVEAL_ANSWER":
      return revealAnswer(state);
    case "SHOW_SCOREBOARD":
      return showScoreboard(state);
    case "NEXT_QUESTION":
      return nextQuestion(state);
    case "RESET_GAME":
      return resetGame(state);
    case "GO_HOME":
      return createInitialState();
    default:
      return state;
  }
}

const GameContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  return (
    <GameContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameContext.Provider>
  );
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error("useGameDispatch must be used within GameProvider");
  return ctx;
}

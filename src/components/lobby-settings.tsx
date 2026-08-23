"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyPromptPoolReason, fetchActiveThemes, type Theme } from "@/lib/content";
import { generateBlockModes } from "@/lib/game-store";
import {
  DEFAULT_ROOM_SETTINGS,
  REVEAL_HOLD_OPTIONS,
  TIMER_SECONDS_OPTIONS,
  settingsSummaryChips,
  startBlockedReason,
  type BlockCount,
  type DifficultyFilter,
  type MaxPlayers,
  type ModeFilter,
  type QuestionsPerBlock,
  type RevealHoldMs,
  type RoomSettings,
  type ThemeMix,
  type TimerSeconds,
} from "@/lib/room-settings";

function StandardMark({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span
      className="ml-1 text-[9px] font-bold uppercase tracking-wider"
      style={{ color: "var(--rp-purple)" }}
    >
      Standard
    </span>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  disabled,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const off = disabled || opt.disabled;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={off}
            onClick={() => onChange(opt.value)}
            className="min-h-11 px-3 rounded-full text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
            style={{
              background: selected ? "var(--rp-purple)" : "var(--rp-bg-muted)",
              color: selected ? "#fff" : "var(--rp-text)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
  standard,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  standard?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 min-h-11">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--rp-text)" }}>
          {label}
          {standard ? <StandardMark on /> : null}
        </p>
        {hint && (
          <p className="text-[10px] leading-tight" style={{ color: "var(--rp-text-secondary)" }}>
            {hint}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative w-12 h-7 rounded-full shrink-0 transition-all disabled:opacity-40"
        style={{ background: checked ? "var(--rp-mint)" : "var(--rp-bg-muted)" }}
      >
        <span
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="p-3.5 mb-2.5"
      style={{
        background: "var(--rp-bg-elevated)",
        borderRadius: "var(--rp-radius-md)",
        boxShadow: "var(--rp-shadow-card)",
      }}
    >
      <h3
        className="text-[10px] font-bold uppercase tracking-wider mb-2.5"
        style={{ color: "var(--rp-purple)" }}
      >
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LobbySettingsPanel({
  settings,
  isHost,
  occupiedSeats,
  onChange,
}: {
  settings: RoomSettings;
  isHost: boolean;
  occupiedSeats: number;
  onChange: (patch: Partial<RoomSettings>) => void;
}) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [poolEmpty, setPoolEmpty] = useState<string | null>(null);

  useEffect(() => {
    void fetchActiveThemes().then(setThemes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const modes = generateBlockModes(settings.blocks, settings.modeFilter);
    void emptyPromptPoolReason(settings, modes).then((reason) => {
      if (!cancelled) setPoolEmpty(reason);
    });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  const themeNames = useMemo(
    () => Object.fromEntries(themes.map((t) => [t.id, t.name_de])),
    [themes],
  );

  if (!isHost) {
    const chips = settingsSummaryChips(settings, themeNames);
    return (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center h-7 px-2.5 rounded-full text-[11px] font-semibold"
            style={{
              background: "rgba(139, 124, 255, 0.12)",
              color: "var(--rp-purple)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    );
  }

  const blocked = startBlockedReason(settings);
  const maxFloor = Math.min(4, Math.max(2, occupiedSeats)) as MaxPlayers;

  return (
    <div className="mb-3">
      <Section title="Inhalt">
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Themenmix
            <StandardMark on={settings.themeMix === DEFAULT_ROOM_SETTINGS.themeMix} />
          </p>
          <Segmented<ThemeMix>
            value={settings.themeMix}
            onChange={(themeMix) => onChange({ themeMix })}
            options={[
              { value: "random", label: "Zufall" },
              { value: "manual", label: "Selbst wählen" },
            ]}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            {settings.themeMix === "random"
              ? "Wir würfeln aus allen aktiven Themen. Peinlichkeit inklusive."
              : "Mindestens eins — sonst starten wir ins Leere."}
          </p>
        </div>

          {settings.themeMix === "manual" && (
            <div className="flex flex-wrap gap-1.5">
              {themes.length === 0 ? (
                <p className="text-[10px]" style={{ color: "var(--rp-text-secondary)" }}>
                  Keine aktiven Themen. Fragemeister füttern, sonst würfeln wir ins Nichts.
                </p>
              ) : (
                themes.map((theme) => {
                  const on = settings.themeIds.includes(theme.id);
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        const themeIds = on
                          ? settings.themeIds.filter((id) => id !== theme.id)
                          : [...settings.themeIds, theme.id];
                        onChange({ themeIds });
                      }}
                      className="min-h-11 px-3 rounded-full text-xs font-bold transition-all active:scale-[0.97]"
                      style={{
                        background: on ? "var(--rp-peach)" : "var(--rp-bg-muted)",
                        color: on ? "#fff" : "var(--rp-text)",
                      }}
                    >
                      {theme.name_de}
                    </button>
                  );
                })
              )}
            </div>
          )}

        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Spielmodi
            <StandardMark on={settings.modeFilter === DEFAULT_ROOM_SETTINGS.modeFilter} />
          </p>
          <Segmented<ModeFilter>
            value={settings.modeFilter}
            onChange={(modeFilter) => onChange({ modeFilter })}
            options={[
              { value: "all", label: "Alle" },
              { value: "number_guess", label: "Nur Schätzfragen" },
              { value: "pick_correct", label: "Nur Auswählen" },
            ]}
          />
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <button
              type="button"
              disabled
              className="min-h-11 px-3 rounded-full text-xs font-bold opacity-40"
              style={{ background: "var(--rp-bg-muted)", color: "var(--rp-text-secondary)" }}
            >
              Lüge finden · Bald
            </button>
            <button
              type="button"
              disabled
              className="min-h-11 px-3 rounded-full text-xs font-bold opacity-40"
              style={{ background: "var(--rp-bg-muted)", color: "var(--rp-text-secondary)" }}
            >
              Reihenfolge · Bald
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Schwierigkeit
            <StandardMark on={settings.difficulty === DEFAULT_ROOM_SETTINGS.difficulty} />
          </p>
          <Segmented<DifficultyFilter>
            value={settings.difficulty}
            onChange={(difficulty) => onChange({ difficulty })}
            options={[
              { value: "mix", label: "Mix" },
              { value: "leicht", label: "Leicht" },
              { value: "mittel", label: "Mittel" },
              { value: "schwer", label: "Schwer" },
            ]}
          />
        </div>
      </Section>

      <Section title="Form">
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Blöcke
            <StandardMark on={settings.blocks === DEFAULT_ROOM_SETTINGS.blocks} />
          </p>
          <Segmented<BlockCount>
            value={settings.blocks}
            onChange={(blocks) => onChange({ blocks })}
            options={[1, 2, 3, 4].map((n) => ({
              value: n as BlockCount,
              label: String(n),
            }))}
          />
        </div>
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Fragen pro Block
            <StandardMark on={settings.questionsPerBlock === DEFAULT_ROOM_SETTINGS.questionsPerBlock} />
          </p>
          <Segmented<QuestionsPerBlock>
            value={settings.questionsPerBlock}
            onChange={(questionsPerBlock) => onChange({ questionsPerBlock })}
            options={[1, 2, 3, 4].map((n) => ({
              value: n as QuestionsPerBlock,
              label: String(n),
            }))}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--rp-text-secondary)" }}>
            Gilt für Schätzfragen. Kartenwahl bleibt eine Runde pro Block — sonst wird uns schwindelig.
          </p>
        </div>
      </Section>

      <Section title="Tempo">
        <ToggleRow
          label="Match-Timer"
          hint="Gleicher Balken für alle, synced über started_at."
          checked={settings.timerEnabled}
          standard={settings.timerEnabled === DEFAULT_ROOM_SETTINGS.timerEnabled}
          onChange={(timerEnabled) => onChange({ timerEnabled })}
        />
        {settings.timerEnabled && (
          <div>
            <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
              Dauer
              <StandardMark on={settings.timerSeconds === DEFAULT_ROOM_SETTINGS.timerSeconds} />
            </p>
            <Segmented<TimerSeconds>
              value={settings.timerSeconds}
              onChange={(timerSeconds) => onChange({ timerSeconds })}
              options={TIMER_SECONDS_OPTIONS.map((s) => ({
                value: s,
                label: `${s}s`,
              }))}
            />
          </div>
        )}
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Pause nach Auflösung
            <StandardMark on={settings.revealHoldMs === DEFAULT_ROOM_SETTINGS.revealHoldMs} />
          </p>
          <Segmented<RevealHoldMs>
            value={settings.revealHoldMs}
            onChange={(revealHoldMs) => onChange({ revealHoldMs })}
            options={REVEAL_HOLD_OPTIONS.map((ms) => ({
              value: ms,
              label: `${(ms / 1000).toLocaleString("de-DE")}s`,
            }))}
          />
        </div>
      </Section>

      <Section title="Raum">
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--rp-text)" }}>
            Max. Spieler
            <StandardMark on={settings.maxPlayers === DEFAULT_ROOM_SETTINGS.maxPlayers} />
          </p>
          <Segmented<MaxPlayers>
            value={settings.maxPlayers}
            onChange={(maxPlayers) => onChange({ maxPlayers })}
            options={[2, 3, 4].map((n) => ({
              value: n as MaxPlayers,
              label: String(n),
              disabled: n < maxFloor,
            }))}
          />
        </div>
        <ToggleRow
          label="Gäste erlaubt"
          hint="Ohne Konto mitspielen. Aus = nur Angemeldete."
          checked={settings.allowGuests}
          standard={settings.allowGuests === DEFAULT_ROOM_SETTINGS.allowGuests}
          onChange={(allowGuests) => onChange({ allowGuests })}
        />
        <ToggleRow
          label="Start wenn voll"
          hint="Sobald die letzte Person rein ist, geht’s los. Kein Gnadenmoment."
          checked={settings.autoStart}
          standard={settings.autoStart === DEFAULT_ROOM_SETTINGS.autoStart}
          onChange={(autoStart) => onChange({ autoStart })}
        />
      </Section>

      {(blocked || poolEmpty) && (
        <p className="text-xs font-medium px-1 mb-1" style={{ color: "var(--rp-danger)" }}>
          {blocked ?? poolEmpty}
        </p>
      )}
    </div>
  );
}

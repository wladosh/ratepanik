"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DecorSchleimi, PlayerSchleimi } from "@/components/player-schleimi";
import { useGame } from "@/lib/game-context";
import { themeArtSrc } from "@/lib/rp-assets";
import { AnswerWaitingPanel } from "./answer-waiting-panel";
import { MatchPlayShell } from "./match-play-shell";
import { MatchStatusHeader } from "./match-status-header";
import styles from "./theme-pick-screen.module.css";

function ThemeCardsSkeleton() {
  return (
    <div
      className={styles.cardGrid}
      role="status"
      aria-live="polite"
      aria-label="Themen werden geladen"
    >
      {[0, 1].map((index) => (
        <div key={index} className={styles.skeletonCard} aria-hidden="true">
          <span className={styles.skeletonArt} />
          <span className={styles.skeletonCopy}>
            <span className={styles.skeletonLabel} />
            <span className={styles.skeletonTitle} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ThemePickScreen() {
  const game = useGame();
  const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
  const submissionLockedRef = useRef(false);
  const picker = game.players.find((p) => p.id === game.themePickerPlayerId);
  const blockNum = (game.room?.current_block_index ?? 0) + 1;
  const totalBlocks = game.room?.total_blocks ?? 4;
  const mode =
    game.roomSettings.modeFilter === "all" ? undefined : game.currentBlock?.mode;
  const pickerName = picker?.display_name ?? "Der Themenprofi";
  const optionsLoading = game.themeOptions.length === 0;

  const handleThemeSelect = async (themeId: string) => {
    if (submissionLockedRef.current) return;

    submissionLockedRef.current = true;
    setPendingThemeId(themeId);

    try {
      await game.selectTheme(themeId);
    } catch {
      submissionLockedRef.current = false;
      setPendingThemeId(null);
    }
  };

  return (
    <MatchPlayShell
      ariaLabel="Themenauswahl"
      contentClassName={styles.content}
    >
      <div className={styles.layout}>
        <MatchStatusHeader
          current={blockNum}
          total={totalBlocks}
          mode={mode}
          questionLabel="Block"
        />

        <section className={styles.intro} aria-labelledby="theme-pick-title">
          <span className={styles.introSpark} aria-hidden="true">
            ✦
          </span>
          <div className={styles.pickerAvatar} aria-hidden="true">
            {picker ? (
              <PlayerSchleimi playerId={picker.id} size={56} />
            ) : (
              <DecorSchleimi seed="theme-pick" size={56} />
            )}
          </div>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>
              {game.isThemePicker ? "Du entscheidest" : `${pickerName} entscheidet`}
            </p>
            <h1 id="theme-pick-title" className={styles.title}>
              {game.isThemePicker ? "Wähl dein Thema" : `${pickerName} wählt`}
            </h1>
            <p className={styles.subtitle}>
              {game.isThemePicker
                ? "Welches Thema bringt eure Runde in Fahrt?"
                : `Lehn dich zurück – ${pickerName} sucht das nächste Thema aus.`}
            </p>
          </div>
        </section>

        {optionsLoading ? (
          <ThemeCardsSkeleton />
        ) : game.isThemePicker ? (
          <div className={styles.cardGrid} aria-label="Themen zur Auswahl">
            {game.themeOptions.map((theme, index) => {
              const artSrc = themeArtSrc(theme.slug);
              const isSelected = pendingThemeId === theme.id;
              const isDisabled = pendingThemeId !== null;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => void handleThemeSelect(theme.id)}
                  disabled={isDisabled}
                  aria-describedby={`theme-hint-${theme.id}`}
                  aria-label={`${theme.name_de} auswählen`}
                  className={[
                    styles.themeCard,
                    index % 2 === 0 ? styles.cardPeach : styles.cardPurple,
                    isSelected ? styles.themeCardSelected : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className={styles.cardGlow} aria-hidden="true" />
                  <span className={styles.cardArt} aria-hidden="true">
                    {artSrc ? (
                      <Image
                        src={artSrc}
                        alt=""
                        width={176}
                        height={176}
                        sizes="176px"
                        className={styles.themeImage}
                        priority
                      />
                    ) : null}
                  </span>
                  <span className={styles.cardCopy}>
                    <span className={styles.cardKicker}>
                      {isSelected ? "Ausgewählt" : `Option ${index + 1}`}
                    </span>
                    <span className={styles.cardTitle}>
                    {theme.name_de}
                  </span>
                    <span
                      id={`theme-hint-${theme.id}`}
                      className={styles.cardAction}
                    >
                      {isSelected ? (
                        <>
                          <span className={styles.checkmark} aria-hidden="true">
                            ✓
                          </span>
                          Wird vorbereitet …
                        </>
                      ) : (
                        <>
                          Thema wählen
                          <span aria-hidden="true">→</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <AnswerWaitingPanel
            className={styles.spectatorPanel}
            title={`${pickerName} wählt gerade`}
            description="Das nächste Thema erscheint gleich für alle."
          >
            <span className={styles.waitingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </AnswerWaitingPanel>
        )}
      </div>
    </MatchPlayShell>
  );
}

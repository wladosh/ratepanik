"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { interpolate } from "@/lib/i18n";
import {
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_CATALOG,
  achievementCopy,
  isAchievementId,
  type AchievementId,
} from "@/lib/achievement-catalog";
import { useAchievements } from "@/lib/use-achievements";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";
import { AchievementSticker } from "@/components/achievement-sticker";
import styles from "./achievements-panel.module.css";

export function AchievementsPanel({ onBack }: { onBack: () => void }) {
  const { t, locale } = useI18n();
  const { user, isGuest } = useAuth();
  const guestView = !user || isGuest;
  const searchParams = useSearchParams();
  const { extraIds, unlocked, loaded } = useAchievements(guestView ? null : user.id);
  const previewUnlocked = useMemo(() => {
    if (searchParams.get("preview") !== "achievements") return new Set<string>();
    return new Set(
      (searchParams.get("unlocked") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }, [searchParams]);
  const unlockedView = previewUnlocked.size > 0
    ? new Set([...unlocked, ...previewUnlocked])
    : unlocked;
  const items = [
    ...ACHIEVEMENT_CATALOG.map((item) => item.id),
    ...extraIds.filter((id) => !isAchievementId(id)),
  ];

  return (
    <PanelShell title={t.home.achievements} onBack={onBack}>
      {isGuest && <p className={styles.guestHint}>{t.home.achievementsGuestHint}</p>}
      {!loaded ? (
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          {t.common.loading}
        </p>
      ) : items.length === 0 ? (
        <EmptyCard
          headline={t.home.achievementsEmptyHeadline}
          body={t.home.achievementsEmptyBody}
        />
      ) : (
        <>
          <div className={styles.progress}>
            <p className={styles.progressLabel}>{t.home.achievements}</p>
            <p className={styles.progressMeta}>
              {interpolate(t.home.achievementsProgress, {
                unlocked: unlockedView.size,
                total: items.length,
              })}
            </p>
          </div>
          <ul className={styles.grid}>
            {items.map((id, index) => {
              const isOn = unlockedView.has(id);
              const def = isAchievementId(id) ? ACHIEVEMENT_BY_ID[id as AchievementId] : null;
              const copy = def ? achievementCopy(def, locale) : null;
              return (
                <li key={id} className={styles.tile}>
                  <div
                    className={styles.stickerWrap}
                    data-unlocked={isOn ? "true" : "false"}
                    data-tilt={index % 4}
                  >
                    <AchievementSticker id={id} unlocked={isOn} size={118} />
                  </div>
                  {isOn && copy ? (
                    <div className={styles.copy}>
                      <p className={styles.name}>{copy.title}</p>
                      <p className={styles.description}>{copy.description}</p>
                    </div>
                  ) : (
                    <span className={styles.srOnly}>{t.home.achievementLockedAria}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </PanelShell>
  );
}

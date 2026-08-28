"use client";

import { useAuth } from "@/lib/auth-context";
import { useI18n, LoadingPulse } from "@/lib/i18n-context";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LandingScreen } from "@/components/landing-screen";
import { AchievementsPanel } from "@/components/achievements-panel";
import { useAchievementToast } from "@/lib/achievement-toast-context";
import { isAchievementId } from "@/lib/achievement-catalog";
import { SetUsernameScreen } from "@/components/set-username-screen";
import { AvatarOnboardingScreen } from "@/components/avatar-onboarding-screen";
import { GameProvider } from "@/lib/game-context";
import { Game } from "@/components/game";
import { useProfile } from "@/lib/use-profile";
import { GuestExitToLogin, JoinSessionGate } from "@/components/joining-screen";
import {
  hasActiveGameSession,
  isJoinCode,
  shouldRestoreMatchOnBareHome,
} from "@/lib/guest-flow";

function AchievementsPreview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueue } = useAchievementToast();

  useEffect(() => {
    const unlockId = searchParams.get("unlock");
    if (unlockId && isAchievementId(unlockId)) {
      enqueue(unlockId);
    }
  }, [enqueue, searchParams]);

  return <AchievementsPanel onBack={() => router.replace("/")} />;
}

function HomeContent() {
  const { t } = useI18n();
  const {
    user,
    isAuthenticated,
    isGuest,
    loading,
    needsUsername,
    needsAvatarOnboarding,
    refetchProfile,
    markAvatarOnboardingDone,
  } = useAuth();
  const { claimUsername, checkUsername } = useProfile(user);
  const searchParams = useSearchParams();
  const joinParam = searchParams.get("join") ?? undefined;
  const joinCode = isJoinCode(joinParam) ? joinParam.toUpperCase() : undefined;

  if (searchParams.get("preview") === "achievements") {
    return <AchievementsPreview />;
  }

  const activeGame = hasActiveGameSession();

  if (joinCode) {
    return (
      <JoinSessionGate joinCode={joinCode}>
        <GameProvider joinCode={joinCode}>
          <Game />
        </GameProvider>
      </JoinSessionGate>
    );
  }

  if (loading) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: "var(--rp-nb-cream)" }}
      >
        <div className="nb-heading text-lg" style={{ color: "var(--rp-nb-black)" }}>
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (isGuest) {
    return <GuestExitToLogin />;
  }

  if (activeGame && shouldRestoreMatchOnBareHome(isGuest)) {
    return (
      <GameProvider>
        <Game />
      </GameProvider>
    );
  }

  if (!isAuthenticated) {
    return <LandingScreen />;
  }

  if (needsUsername) {
    const defaultName =
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "";

    return (
      <SetUsernameScreen
        onClaimed={refetchProfile}
        claimUsername={claimUsername}
        checkUsername={checkUsername}
        defaultName={defaultName}
      />
    );
  }

  if (needsAvatarOnboarding && user) {
    return (
      <AvatarOnboardingScreen
        userId={user.id}
        onDone={async () => {
          markAvatarOnboardingDone();
          await refetchProfile();
        }}
      />
    );
  }

  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingPulse />}>
      <HomeContent />
    </Suspense>
  );
}

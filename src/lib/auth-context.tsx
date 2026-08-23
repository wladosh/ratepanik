"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/use-profile";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  canHost: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  needsUsername: boolean;
  needsAvatarOnboarding: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  markAvatarOnboardingDone: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarOnboardingDismissed, setAvatarOnboardingDismissed] = useState(false);
  const supabase = createBrowserSupabase();

  const fetchProfile = useCallback(
    async (uid?: string) => {
      const userId = uid ?? user?.id;
      if (!userId) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username, xp, level, hirncoins, avatar_id, avatar_onboarding_done, current_streak, friend_code, last_seen_at, created_at, updated_at")
        .eq("id", userId)
        .single();

      setProfile((data as Profile) ?? null);
      setProfileLoading(false);
    },
    [user?.id, supabase]
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setLoading(false);
      if (u && !u.is_anonymous) {
        fetchProfile(u.id);
      } else {
        setProfileLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u && !u.is_anonymous) {
        fetchProfile(u.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const isGuest = user?.is_anonymous === true;
  const isAuthenticated = !!user;
  const canHost = isAuthenticated && !isGuest;
  const needsUsername = !profileLoading && !!user && !isGuest && !profile;

  const needsAvatarOnboarding =
    !profileLoading &&
    !!user &&
    !isGuest &&
    !!profile &&
    !profile.avatar_onboarding_done &&
    !avatarOnboardingDismissed &&
    (typeof window === "undefined" ||
      !localStorage.getItem(`rp_avatar_onboarding_${user.id}`));

  const markAvatarOnboardingDone = useCallback(() => {
    setAvatarOnboardingDismissed(true);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        isAuthenticated,
        canHost,
        profile,
        profileLoading,
        needsUsername,
        needsAvatarOnboarding,
        signOut,
        refetchProfile: fetchProfile,
        markAvatarOnboardingDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

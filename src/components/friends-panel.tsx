"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useGame } from "@/lib/game-context";
import { useFriends } from "@/lib/use-friends";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { shareOrCopyJoinLink } from "@/lib/join-link";
import { parseFriendCodePayload } from "@/lib/match-ui";
import { UserSchleimi } from "@/components/player-schleimi";
import type { DbFriendProfile } from "@/lib/supabase";
import { EmptyCard, PanelShell } from "@/components/home-panel-shell";

const ONLINE_MS = 2 * 60 * 1000;

function formatPresence(lastSeenAt: string | null): { label: string; online: boolean } {
  if (!lastSeenAt) return { label: "Lange her", online: false };
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (Number.isNaN(diff) || diff < 0) return { label: "Lange her", online: false };
  if (diff < ONLINE_MS) return { label: "Online", online: true };
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return { label: `Vor ${minutes} Min.`, online: false };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `Vor ${hours} Std.`, online: false };
  const days = Math.floor(hours / 24);
  return { label: `Vor ${days} Tag${days === 1 ? "" : "en"}`, online: false };
}

function FriendAvatar({ profile }: { profile: DbFriendProfile }) {
  return (
    <UserSchleimi userId={profile.id} seed={profile.id} size={40} label={profile.username} />
  );
}

export function FriendsPanel({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { user, isGuest, profile, profileLoading } = useAuth();
  const game = useGame();
  const { loading, incoming, outgoing, friends, addFriend, respond, remove } =
    useFriends(user && !isGuest ? user.id : null);

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [friendCode, setFriendCode] = useState<string | null>(profile?.friend_code ?? null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (profile?.friend_code) setFriendCode(profile.friend_code);
  }, [profile?.friend_code]);

  useEffect(() => {
    if (!user || isGuest) return;
    if (profile?.friend_code) return;
    const supabase = createBrowserSupabase();
    void supabase.rpc("ensure_friend_code").then(({ data, error }) => {
      if (error) return;
      const code = parseFriendCodePayload(data);
      if (code) setFriendCode(code);
    });
  }, [user, isGuest, profile?.friend_code]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const ident = query.trim();
    if (!ident) {
      setFormError(t.friends.addPlaceholder);
      return;
    }
    setBusy(true);
    setFormError(null);
    const result = await addFriend(ident);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error ?? t.friends.sent);
      return;
    }
    setQuery("");
    showToast(t.friends.sent);
  }

  async function handleCopyCode() {
    if (!friendCode) return;
    try {
      await navigator.clipboard.writeText(friendCode);
      showToast(t.friends.copied);
    } catch {
      showToast(t.friends.copyFailed);
    }
  }

  async function handleInvite() {
    if (!user?.id) return;
    const displayName =
      profile?.username ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Spieler";
    setInvitingId("pending");
    const code = await game.createRoom(displayName, user.id);
    if (!code) {
      setInvitingId(null);
      showToast("Raum konnte nicht erstellt werden");
      return;
    }
    const result = await shareOrCopyJoinLink(code);
    setInvitingId(null);
    if (result === "copied") showToast("Link kopiert");
    else if (result === "failed") showToast("Kopieren fehlgeschlagen");
  }

  if (!isGuest && profileLoading) {
    return (
      <PanelShell title={t.home.friends} onBack={onBack}>
        <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
          {t.friends.loading}
        </p>
      </PanelShell>
    );
  }

  if (isGuest || !profile) {
    return (
      <PanelShell title={t.home.friends} onBack={onBack}>
        <EmptyCard
          headline={t.friends.needsAccountHeadline}
          body={t.friends.needsAccountBody}
        />
        <Link
          href="/auth/login"
          className="nb-btn mt-4 flex h-11 items-center justify-center text-sm text-white"
          style={{ background: "var(--rp-nb-peach)" }}
        >
          {t.landing.login}
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell title={t.home.friends} onBack={onBack}>
      {toast && (
        <div
          className="rp-shell-banner nb-card px-6 py-3 text-center font-black text-white animate-fade-in uppercase"
          style={{ background: "var(--rp-nb-purple-deep)" }}
        >
          {toast}
        </div>
      )}

      <section className="nb-card flex items-center justify-between gap-3 px-4 py-3 mb-4">
        <div>
          <p className="nb-kicker">
            {t.friends.yourCode}
          </p>
          <p
            className="text-lg font-black tracking-[0.18em]"
            style={{ color: "var(--rp-nb-text)", fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            {friendCode ?? "······"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyCode()}
          disabled={!friendCode}
          className="nb-btn h-11 px-4 text-xs"
          style={{ background: "var(--rp-nb-lilac)", color: "var(--rp-nb-purple-deep)" }}
        >
          {t.friends.copy}
        </button>
      </section>

      <form onSubmit={(e) => void handleAdd(e)} className="mb-5">
        <label
          htmlFor="friend-ident"
          className="block text-xs font-black uppercase mb-1.5 px-1"
          style={{ color: "var(--rp-nb-text-secondary)" }}
        >
          {t.friends.addLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="friend-ident"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={t.friends.addPlaceholder}
            autoComplete="off"
            className="nb-input flex-1 h-11 px-3 text-sm"
            style={{
              borderColor: formError ? "var(--rp-nb-red)" : "var(--rp-nb-black)",
            }}
          />
          <button
            type="submit"
            disabled={busy}
            className="nb-btn h-11 px-4 text-sm text-white shrink-0"
            style={{ background: "var(--rp-nb-peach)" }}
          >
            {t.friends.add}
          </button>
        </div>
        {formError && (
          <p className="mt-1.5 text-xs font-bold px-1" style={{ color: "var(--rp-nb-red)" }}>
            {formError}
          </p>
        )}
      </form>

      {loading ? (
        <p className="text-sm font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
          Laden…
        </p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="mb-5">
              <h2 className="nb-kicker mb-2 px-1">Anfragen</h2>
              <ul className="space-y-2">
                {incoming.map((entry) => (
                  <li key={entry.friendshipId} className="nb-card flex items-center gap-3 px-3 py-2.5">
                    <FriendAvatar profile={entry.profile} />
                    <span className="flex-1 text-sm font-black truncate" style={{ color: "var(--rp-nb-text)" }}>
                      {entry.profile.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => void respond(entry.friendshipId, false)}
                      className="nb-btn h-11 px-3 text-xs"
                      style={{ background: "var(--rp-nb-cream)", color: "var(--rp-nb-text-secondary)" }}
                    >
                      Ablehnen
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(entry.friendshipId, true)}
                      className="nb-btn h-11 px-3 text-xs text-white"
                      style={{ background: "var(--rp-nb-purple-deep)" }}
                    >
                      Annehmen
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {outgoing.length > 0 && (
            <section className="mb-5">
              <h2 className="nb-kicker mb-2 px-1">Gesendet</h2>
              <ul className="space-y-2">
                {outgoing.map((entry) => (
                  <li key={entry.friendshipId} className="nb-card flex items-center gap-3 px-3 py-2.5">
                    <FriendAvatar profile={entry.profile} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: "var(--rp-nb-text)" }}>
                        {entry.profile.username}
                      </p>
                      <p className="text-[10px] font-bold" style={{ color: "var(--rp-nb-text-secondary)" }}>
                        Anfrage läuft
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(entry.friendshipId)}
                      className="nb-btn h-11 px-3 text-xs"
                      style={{ background: "var(--rp-nb-cream)", color: "var(--rp-nb-text-secondary)" }}
                    >
                      Abbrechen
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="nb-kicker mb-2 px-1">
              {t.friends.listTitle}
            </h2>
            {friends.length === 0 ? (
              <EmptyCard
                headline={t.friends.emptyHeadline}
                body={t.friends.emptyBody}
              />
            ) : (
              <ul className="space-y-2">
                {friends.map((entry) => {
                  const presence = formatPresence(entry.profile.last_seen_at);
                  return (
                    <li key={entry.friendshipId} className="nb-card flex items-center gap-3 px-3 py-2.5">
                      <FriendAvatar profile={entry.profile} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate" style={{ color: "var(--rp-nb-text)" }}>
                          {entry.profile.username}
                        </p>
                        <p
                          className="text-[10px] font-bold"
                          style={{
                            color: presence.online ? "var(--rp-nb-green)" : "var(--rp-nb-text-secondary)",
                          }}
                        >
                          {presence.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(entry.friendshipId)}
                        className="nb-btn h-11 px-2 text-[10px]"
                        style={{ background: "var(--rp-nb-cream)", color: "var(--rp-nb-text-secondary)" }}
                      >
                        Entfernen
                      </button>
                      <button
                        type="button"
                        disabled={invitingId !== null}
                        onClick={() => void handleInvite()}
                        className="nb-btn h-11 px-3 text-xs text-white"
                        style={{ background: "var(--rp-nb-peach)" }}
                      >
                        Einladen
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </PanelShell>
  );
}

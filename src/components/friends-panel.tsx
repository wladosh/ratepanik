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
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
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
          className="mt-4 flex h-11 items-center justify-center rounded-[var(--rp-radius-pill)] text-sm font-bold text-white"
          style={{
            background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
          }}
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
          className="rp-shell-banner rounded-2xl px-6 py-3 text-center font-bold text-white shadow-xl animate-fade-in"
          style={{ background: "var(--rp-purple)" }}
        >
          {toast}
        </div>
      )}

      <section
        className="flex items-center justify-between gap-3 px-4 py-3 mb-4"
        style={{
          background: "var(--rp-bg-elevated)",
          borderRadius: "var(--rp-radius-md)",
          boxShadow: "var(--rp-shadow-card)",
        }}
      >
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--rp-purple)" }}
          >
            {t.friends.yourCode}
          </p>
          <p
            className="text-lg font-black tracking-[0.18em]"
            style={{ color: "var(--rp-text)" }}
          >
            {friendCode ?? "······"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyCode()}
          disabled={!friendCode}
          className="h-11 px-4 rounded-full text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: "var(--rp-purple-soft)",
            color: "var(--rp-purple)",
          }}
        >
          {t.friends.copy}
        </button>
      </section>

      <form onSubmit={(e) => void handleAdd(e)} className="mb-5">
        <label
          htmlFor="friend-ident"
          className="block text-xs font-bold mb-1.5 px-1"
          style={{ color: "var(--rp-text-secondary)" }}
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
            className="flex-1 h-11 rounded-xl border-2 px-3 text-sm font-medium text-[var(--rp-text)] placeholder:text-gray-300 focus:outline-none"
            style={{
              borderColor: formError ? "var(--rp-danger)" : "var(--rp-border)",
              background: "#FAFAFA",
            }}
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 px-4 rounded-xl text-sm font-bold text-white shrink-0 transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
            }}
          >
            {t.friends.add}
          </button>
        </div>
        {formError && (
          <p className="mt-1.5 text-xs font-medium px-1" style={{ color: "var(--rp-danger)" }}>
            {formError}
          </p>
        )}
      </form>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--rp-text-secondary)" }}>
          Laden…
        </p>
      ) : (
        <>
          {incoming.length > 0 && (
            <section className="mb-5">
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
                style={{ color: "var(--rp-text-secondary)" }}
              >
                Anfragen
              </h2>
              <ul className="space-y-2">
                {incoming.map((entry) => (
                  <li
                    key={entry.friendshipId}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      background: "var(--rp-bg-elevated)",
                      borderRadius: "var(--rp-radius-md)",
                      boxShadow: "var(--rp-shadow-card)",
                    }}
                  >
                    <FriendAvatar profile={entry.profile} />
                    <span
                      className="flex-1 text-sm font-extrabold truncate"
                      style={{ color: "var(--rp-text)" }}
                    >
                      {entry.profile.username}
                    </span>
                    <button
                      type="button"
                      onClick={() => void respond(entry.friendshipId, false)}
                      className="h-11 px-3 rounded-full text-xs font-bold"
                      style={{ color: "var(--rp-text-secondary)" }}
                    >
                      Ablehnen
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(entry.friendshipId, true)}
                      className="h-11 px-3 rounded-full text-xs font-bold text-white"
                      style={{ background: "var(--rp-purple)" }}
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
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
                style={{ color: "var(--rp-text-secondary)" }}
              >
                Gesendet
              </h2>
              <ul className="space-y-2">
                {outgoing.map((entry) => (
                  <li
                    key={entry.friendshipId}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{
                      background: "var(--rp-bg-elevated)",
                      borderRadius: "var(--rp-radius-md)",
                      boxShadow: "var(--rp-shadow-card)",
                    }}
                  >
                    <FriendAvatar profile={entry.profile} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-extrabold truncate"
                        style={{ color: "var(--rp-text)" }}
                      >
                        {entry.profile.username}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--rp-text-secondary)" }}>
                        Anfrage läuft
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(entry.friendshipId)}
                      className="h-11 px-3 rounded-full text-xs font-bold"
                      style={{ color: "var(--rp-text-secondary)" }}
                    >
                      Abbrechen
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider mb-2 px-1"
              style={{ color: "var(--rp-text-secondary)" }}
            >
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
                    <li
                      key={entry.friendshipId}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        background: "var(--rp-bg-elevated)",
                        borderRadius: "var(--rp-radius-md)",
                        boxShadow: "var(--rp-shadow-card)",
                      }}
                    >
                      <FriendAvatar profile={entry.profile} />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-extrabold truncate"
                          style={{ color: "var(--rp-text)" }}
                        >
                          {entry.profile.username}
                        </p>
                        <p
                          className="text-[10px] font-semibold"
                          style={{
                            color: presence.online ? "var(--rp-success)" : "var(--rp-text-secondary)",
                          }}
                        >
                          {presence.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(entry.friendshipId)}
                        className="h-11 px-2 rounded-full text-[10px] font-bold"
                        style={{ color: "var(--rp-text-secondary)" }}
                      >
                        Entfernen
                      </button>
                      <button
                        type="button"
                        disabled={invitingId !== null}
                        onClick={() => void handleInvite()}
                        className="h-11 px-3 rounded-full text-xs font-bold text-white disabled:opacity-50"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--rp-peach) 0%, var(--rp-peach-deep) 100%)",
                        }}
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

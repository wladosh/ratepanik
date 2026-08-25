"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PlayerSchleimi } from "@/components/player-schleimi";
import { joinUrl } from "@/lib/join-link";
import {
  encodeJoinQr,
  FINDER_SIZE,
  finderOrigins,
  isInLogoMask,
  isPositionModule,
  JOIN_QR_QUIET_MODULES,
} from "@/lib/join-qr";
import { useI18n } from "@/lib/i18n-context";
import styles from "./lobby-join-qr.module.css";

gsap.registerPlugin(useGSAP);

const CELL = 10;
const INK_DARK = "#2A2A4A";
const PAPER = "#FFF8F5";
const FINDER_GLINTS = ["#FF8A71", "#6FCFB2", "#7EB6FF"] as const;

const CONFETTI = [
  { x: "6%", y: "10%", color: "var(--rp-yellow)", rotate: -18, w: 9, h: 4 },
  { x: "88%", y: "8%", color: "var(--rp-pink)", rotate: 28, w: 8, h: 8 },
  { x: "4%", y: "72%", color: "var(--rp-sky)", rotate: 12, w: 7, h: 3 },
  { x: "92%", y: "64%", color: "var(--rp-mint)", rotate: -40, w: 10, h: 4 },
  { x: "12%", y: "92%", color: "var(--rp-purple)", rotate: 50, w: 6, h: 6 },
  { x: "78%", y: "90%", color: "var(--rp-peach)", rotate: -12, w: 8, h: 3 },
] as const;

function QrGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="4.1" y="4.1" width="2.8" height="2.8" rx="0.7" fill="#FF8A71" />
      <rect x="15" y="2" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="17.1" y="4.1" width="2.8" height="2.8" rx="0.7" fill="#FF8A71" />
      <rect x="2" y="15" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="4.1" y="17.1" width="2.8" height="2.8" rx="0.7" fill="#FF8A71" />
      <path
        d="M14.2 14.4c1.4-3.4 6.6-2.4 6.6 1.7 0 2.6-2.1 4.6-4.7 4.6-2.2 0-3.7-1.2-4.1-2.8"
        fill="#FFB59F"
      />
      <circle cx="16.2" cy="16.6" r="1.15" fill="#2A2A4A" />
      <circle cx="15.85" cy="16.25" r="0.35" fill="#fff" />
    </svg>
  );
}

function SchleimiSeal() {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
      <ellipse cx="32" cy="46" rx="18" ry="8" fill={INK_DARK} opacity="0.12" />
      <path
        d="M14 36c3-16 14-24 18-24s15 8 18 24c1 8-6 18-18 18S13 44 14 36z"
        fill="#FF8A71"
      />
      <path
        d="M16.5 35c2.6-13.5 12.4-20.5 15.5-20.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <ellipse cx="26" cy="33" rx="5.4" ry="6.4" fill={INK_DARK} />
      <circle cx="24.4" cy="31.2" r="1.6" fill="#fff" />
    </svg>
  );
}

function FinderEye({
  originX,
  originY,
  glint,
}: {
  originX: number;
  originY: number;
  glint: string;
}) {
  const x = (originX + JOIN_QR_QUIET_MODULES) * CELL;
  const y = (originY + JOIN_QR_QUIET_MODULES) * CELL;
  const outer = FINDER_SIZE * CELL;
  return (
    <g>
      <rect x={x} y={y} width={outer} height={outer} rx={CELL * 1.65} fill={INK_DARK} />
      <rect
        x={x + CELL}
        y={y + CELL}
        width={CELL * 5}
        height={CELL * 5}
        rx={CELL * 1.05}
        fill={PAPER}
      />
      <rect
        x={x + CELL * 2}
        y={y + CELL * 2}
        width={CELL * 3}
        height={CELL * 3}
        rx={CELL * 0.85}
        fill={INK_DARK}
      />
      <circle cx={x + CELL * 3.15} cy={y + CELL * 3.05} r={CELL * 0.42} fill={glint} />
      <circle cx={x + CELL * 2.95} cy={y + CELL * 2.85} r={CELL * 0.16} fill="#fff" />
    </g>
  );
}

function StyledJoinQr({ url, inkId }: { url: string; inkId: string }) {
  const qr = useMemo(() => encodeJoinQr(url), [url]);
  const quiet = JOIN_QR_QUIET_MODULES;
  const dim = (qr.size + quiet * 2) * CELL;
  const inset = CELL * 0.06;
  const dot = CELL - inset * 2;

  return (
    <svg
      className={styles.qr}
      viewBox={`0 0 ${dim} ${dim}`}
      role="img"
      data-join-url={url}
      aria-hidden
    >
      <defs>
        <linearGradient id={inkId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2C2458" />
          <stop offset="100%" stopColor="#1F1F38" />
        </linearGradient>
      </defs>
      <rect width={dim} height={dim} rx={CELL * 2.4} fill={PAPER} />
      {qr.data.flatMap((row, y) =>
        row.flatMap((on, x) => {
          if (!on || isPositionModule(qr.types, x, y) || isInLogoMask(x, y, qr.size)) {
            return [];
          }
          return (
            <rect
              key={`${x}-${y}`}
              x={(x + quiet) * CELL + inset}
              y={(y + quiet) * CELL + inset}
              width={dot}
              height={dot}
              rx={dot * 0.28}
              fill={`url(#${inkId})`}
            />
          );
        }),
      )}
      {finderOrigins(qr.size).map((origin, index) => (
        <FinderEye
          key={`${origin.x}-${origin.y}`}
          originX={origin.x}
          originY={origin.y}
          glint={FINDER_GLINTS[index] ?? FINDER_GLINTS[0]}
        />
      ))}
    </svg>
  );
}

function JoinQrDialog({
  code,
  mascotPlayerId,
  onClose,
}: {
  code: string;
  mascotPlayerId: string | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const inkId = `join-qr-ink-${useId().replace(/:/g, "")}`;
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(joinUrl(code));
  }, [code]);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ticket = root.querySelector("[data-ticket]");
      const mascot = root.querySelector("[data-mascot]");
      const bits = gsap.utils.toArray<HTMLElement>("[data-confetti]", root);
      if (!ticket) return;

      if (reduce) {
        gsap.from(ticket, { opacity: 0, duration: 0.2 });
        return;
      }

      gsap.from(ticket, {
        y: 28,
        scale: 0.9,
        opacity: 0,
        duration: 0.48,
        ease: "back.out(1.7)",
      });
      if (mascot) {
        gsap.from(mascot, { y: -12, scale: 0.6, duration: 0.5, ease: "back.out(2)" });
        gsap.to(mascot, {
          y: -5,
          duration: 1.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      }
      gsap.from(bits, {
        scale: 0,
        opacity: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: "back.out(2)",
      });
      gsap.to(bits, {
        y: "+=7",
        rotation: "+=12",
        duration: 1.8,
        yoyo: true,
        repeat: -1,
        stagger: 0.12,
        ease: "sine.inOut",
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lobby-join-qr-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.ticket} data-ticket>
        <div className={styles.orbit} aria-hidden>
          {CONFETTI.map((bit) => (
            <span
              key={`${bit.x}-${bit.y}`}
              data-confetti
              className={styles.confetti}
              style={{
                left: bit.x,
                top: bit.y,
                width: bit.w,
                height: bit.h,
                background: bit.color,
                transform: `rotate(${bit.rotate}deg)`,
                borderRadius: bit.w === bit.h ? 999 : 3,
              }}
            />
          ))}
        </div>

        {mascotPlayerId ? (
          <div className={styles.mascot} data-mascot>
            <PlayerSchleimi playerId={mascotPlayerId} size={78} />
          </div>
        ) : null}

        <p className={styles.kicker}>{t.lobby.qrTicket}</p>
        <h2 id="lobby-join-qr-title" className={styles.title}>
          {t.lobby.qrTitle}
        </h2>

        <div className={styles.stage}>
          {url ? <StyledJoinQr url={url} inkId={inkId} /> : null}
          <div className={styles.mascotInQr}>
            <div className={styles.badge}>
              <SchleimiSeal />
            </div>
          </div>
        </div>

        <div className={styles.stub}>
          <p className={styles.code}>{code}</p>
          <p className={styles.hint}>{t.lobby.qrHint}</p>
        </div>

        <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
          {t.lobby.qrClose}
        </button>
      </div>
    </div>
  );
}

export function LobbyJoinQrButton({
  code,
  mascotPlayerId,
}: {
  code: string;
  mascotPlayerId: string | null;
}) {
  const { t } = useI18n();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t.lobby.qrAria}
        onClick={() => setOpen(true)}
      >
        <span className={styles.glyph}>
          <QrGlyph className="h-5 w-5" />
        </span>
        <span className={styles.spark} aria-hidden>
          ✦
        </span>
      </button>
      {open ? (
        <JoinQrDialog code={code} mascotPlayerId={mascotPlayerId} onClose={close} />
      ) : null}
    </>
  );
}

"use client";

import type { ReactNode } from "react";
import { AchievementToastSlot } from "@/lib/achievement-toast-context";

interface PhoneShellProps {
  children: ReactNode;
}

export function PhoneShell({ children }: PhoneShellProps) {
  return (
    <div className="ps-stage">
      <div className="ps-frame">
        <div className="ps-notch" aria-hidden="true">
          <div className="ps-island" />
        </div>
        <div className="ps-screen" style={{ position: "relative" }}>
          <AchievementToastSlot />
          {children}
        </div>
      </div>
    </div>
  );
}

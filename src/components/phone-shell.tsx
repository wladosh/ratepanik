"use client";

import type { ReactNode } from "react";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="ps-wrap">
      <div className="ps-frame">
        <div className="ps-notch" aria-hidden="true" />
        <div className="ps-screen">{children}</div>
        <div className="ps-home" aria-hidden="true" />
      </div>
    </div>
  );
}

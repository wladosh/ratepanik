"use client";

import type { ReactNode } from "react";

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
        <div className="ps-screen">{children}</div>
      </div>
    </div>
  );
}

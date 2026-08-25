import { encode, QrCodeDataType, type QrCodeGenerateResult } from "uqr";

/** High ECC so a center mascot can sit on the code without breaking scans. */
export const JOIN_QR_ECC = "H" as const;
export const JOIN_QR_MIN_VERSION = 5;
export const JOIN_QR_QUIET_MODULES = 4;
export const FINDER_SIZE = 7;

export function encodeJoinQr(url: string): QrCodeGenerateResult {
  return encode(url, {
    ecc: JOIN_QR_ECC,
    boostEcc: true,
    minVersion: JOIN_QR_MIN_VERSION,
    border: 0,
  });
}

export function logoMaskRadius(size: number): number {
  return size * 0.16;
}

export function isInLogoMask(x: number, y: number, size: number): boolean {
  const radius = logoMaskRadius(size);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

export function finderOrigins(size: number): Array<{ x: number; y: number }> {
  return [
    { x: 0, y: 0 },
    { x: size - FINDER_SIZE, y: 0 },
    { x: 0, y: size - FINDER_SIZE },
  ];
}

export function isPositionModule(
  types: QrCodeGenerateResult["types"],
  x: number,
  y: number,
): boolean {
  return types[y]?.[x] === QrCodeDataType.Position;
}

import { describe, expect, it } from "vitest";
import { QrCodeDataType } from "uqr";
import {
  encodeJoinQr,
  finderOrigins,
  isInLogoMask,
  isPositionModule,
  logoMaskRadius,
} from "./join-qr";

describe("encodeJoinQr", () => {
  it("builds a square matrix with three finder eyes", () => {
    const qr = encodeJoinQr("https://ratepanik.example/?join=ABC123");
    expect(qr.size).toBeGreaterThanOrEqual(37);
    expect(qr.data).toHaveLength(qr.size);
    expect(qr.data.every((row) => row.length === qr.size)).toBe(true);

    for (const origin of finderOrigins(qr.size)) {
      expect(qr.types[origin.y][origin.x]).toBe(QrCodeDataType.Position);
      expect(isPositionModule(qr.types, origin.x + 3, origin.y + 3)).toBe(true);
    }
  });

  it("changes when the room code changes", () => {
    const a = encodeJoinQr("https://ratepanik.example/?join=AAAAAA");
    const b = encodeJoinQr("https://ratepanik.example/?join=BBBBBB");
    expect(a.data).not.toEqual(b.data);
  });
});

describe("logo mask", () => {
  it("covers the center and leaves finder corners free", () => {
    const size = 37;
    const radius = logoMaskRadius(size);
    expect(isInLogoMask(18, 18, size)).toBe(true);
    expect(isInLogoMask(0, 0, size)).toBe(false);
    expect(isInLogoMask(size - 1, 0, size)).toBe(false);
    expect(radius).toBeLessThan(size * 0.18);
  });
});

# Asset Manifest — public/rp/

> Ratepanik shared assets — UX-approved **Peinlich-Pastell** visual style.

## Tranche 1 — Home subset

Covers: navigation icons, default avatars, currency coin, trophy.

### Navigation Icons (SVG masters + PNG rasters)

| Base name | SVG | 1x (24px) | @2x (48px) | @3x (72px) |
|-----------|-----|-----------|------------|------------|
| `rp_nav_home_24` | ✓ | ✓ | ✓ | ✓ |
| `rp_nav_quiz_24` | ✓ | ✓ | ✓ | ✓ |
| `rp_nav_play_24` | ✓ | ✓ | ✓ | ✓ |
| `rp_nav_rank_24` | ✓ | ✓ | ✓ | ✓ |
| `rp_nav_profile_24` | ✓ | ✓ | ✓ | ✓ |

### Default Avatars

| Base name | 128px | @2x (256px) | 512px |
|-----------|-------|-------------|-------|
| `rp_avatar_default_01` | ✓ | ✓ | ✓ |
| `rp_avatar_default_02` | ✓ | ✓ | ✓ |
| `rp_avatar_default_03` | ✓ | ✓ | ✓ |
| `rp_avatar_default_04` | ✓ | ✓ | ✓ |
| `rp_avatar_default_05` | ✓ | ✓ | ✓ |
| `rp_avatar_default_06` | ✓ | ✓ | ✓ |

### Currency

| File | Size |
|------|------|
| `rp_currency_coin_24.png` | 24×24 |
| `rp_currency_coin_24@2x.png` | 48×48 |
| `rp_currency_coin_24@3x.png` | 72×72 |

### Trophy

| File | Size |
|------|------|
| `rp_trophy_gold_512.png` | 512×512 (actual 1024×1024) |

## Notes

- All assets are delivered by the Asset team — do NOT generate or invent replacements.
- Style: Peinlich-Pastell — soft 3D pastels, rounded forms, dark-indigo (#3D2B6B) nav fills.
- Images served via Next.js `public/` directory at path `/rp/<filename>`.
- More files (ranks/achievements/loot/confetti) may follow in a subsequent tranche on this branch/PR.

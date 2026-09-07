// Shared design-system color tokens.
// These hex values were duplicated identically across 25-32 page files —
// this is the single source of truth going forward. Only colors that were
// byte-identical everywhere were extracted; page-specific accent colors
// (e.g. per-page SUCCESS/WARNING variants) were left alone.
//
// PRIMARY and TEXT_MUTED are darkened from their original values
// (#5B8C8F / #6B8A8C) — as text/icon colors they only hit 3.7-3.8:1
// contrast against white, failing WCAG AA's 4.5:1 for normal text. These
// values keep the same hue/character while clearing 4.5:1.
export const PRIMARY = '#497072'
export const PRIMARY_SOFT = '#E8F0F0'
export const TEXT_DARK = '#2C3E3F'
export const TEXT_MUTED = '#556E70'
export const BORDER = '#DCE5E5'
export const CARD_BG = '#FFFFFF'

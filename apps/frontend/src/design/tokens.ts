import type { CSSProperties } from "react";

export const tokens = {
  colors: {
    bg: "#FAF7F0",
    surface: "rgba(255, 252, 247, 0.82)",
    surfaceStrong: "rgba(255, 252, 247, 0.92)",
    nav: "rgba(250, 247, 240, 0.78)",
    text: "#1E1E1E",
    muted: "#7A756E",
    accent: "#B08A5A",
    accentSoft: "rgba(176, 138, 90, 0.12)",
    success: "#6F8A6A",
    successSoft: "rgba(111, 138, 106, 0.12)",
    danger: "#B55A4A",
    dangerSoft: "rgba(181, 90, 74, 0.12)",
    line: "rgba(30, 30, 30, 0.08)",
    lineStrong: "rgba(30, 30, 30, 0.12)"
  },
  type: {
    family: 'Inter, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
    h1: "clamp(2rem, 6vw, 2.5rem)",
    h2: "clamp(1.45rem, 4vw, 1.75rem)",
    body: "16px",
    caption: "12px"
  },
  spacing: {
    screen: "24px",
    section: "32px",
    card: "16px"
  },
  radius: {
    card: "28px",
    item: "16px",
    pill: "999px"
  },
  shadow: {
    soft: "0 12px 40px rgba(0, 0, 0, 0.06)"
  },
  motion: {
    duration: "220ms",
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  }
} as const;

export function buildTokenVars(): CSSProperties {
  return {
    "--bg": tokens.colors.bg,
    "--surface": tokens.colors.surface,
    "--surface-strong": tokens.colors.surfaceStrong,
    "--nav": tokens.colors.nav,
    "--text": tokens.colors.text,
    "--muted": tokens.colors.muted,
    "--accent": tokens.colors.accent,
    "--accent-soft": tokens.colors.accentSoft,
    "--success": tokens.colors.success,
    "--success-soft": tokens.colors.successSoft,
    "--danger": tokens.colors.danger,
    "--danger-soft": tokens.colors.dangerSoft,
    "--line": tokens.colors.line,
    "--line-strong": tokens.colors.lineStrong,
    "--font-family": tokens.type.family,
    "--font-h1": tokens.type.h1,
    "--font-h2": tokens.type.h2,
    "--font-body": tokens.type.body,
    "--font-caption": tokens.type.caption,
    "--space-screen": tokens.spacing.screen,
    "--space-section": tokens.spacing.section,
    "--space-card": tokens.spacing.card,
    "--radius-card": tokens.radius.card,
    "--radius-item": tokens.radius.item,
    "--radius-pill": tokens.radius.pill,
    "--shadow-soft": tokens.shadow.soft,
    "--motion-duration": tokens.motion.duration,
    "--motion-easing": tokens.motion.easing
  } as CSSProperties;
}

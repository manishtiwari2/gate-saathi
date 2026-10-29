/** Join class names, dropping falsy values. Small local helper (no clsx dependency). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a count of seconds as H:MM:SS or MM:SS. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * Generate a human-friendly room key (8 chars, no ambiguous glyphs). The key is
 * the only secret needed to join, so it uses a cryptographic RNG.
 */
export function generateRoomKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // 32 symbols divide 256 evenly, so `byte % 32` is unbiased.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/** Sign-in URL that brings the user back to `pathname` afterwards. */
export function loginHref(pathname: string | null): string {
  return pathname && pathname !== "/" && pathname !== "/login"
    ? `/login?callbackUrl=${encodeURIComponent(pathname)}`
    : "/login";
}

/**
 * A post-login redirect target, accepted only if it is a same-site path
 * (blocks open redirects like "//evil.example" or "https://…").
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

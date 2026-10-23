"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Top-down 2D virtual library. The local player moves with WASD / arrow keys;
 * position is pushed to the presence channel a few times a second, and other
 * players are fetched on the same cadence (matching the reference's polling
 * model). Rendering is a simple canvas scene — zones, desks and avatars.
 */

const WORLD_W = 960;
const WORLD_H = 600;
const SPEED = 4;
const AVATAR_R = 12;

const COLORS = [
  "#b8710e", "#2d7a4f", "#c43e3e", "#4f6bb8", "#8a4fb8", "#b84f8a",
  "#4fb8a8", "#b8a84f", "#6b8a4f", "#4f8ab8", "#b86b4f", "#8ab84f",
];

interface RemotePlayer {
  id: string;
  label: string;
  x: number;
  y: number;
  colorIndex: number;
}

const ZONES = [
  { name: "Main Reading Area", x: 40, y: 40, w: 420, h: 240, fill: "rgba(184,113,14,0.06)" },
  { name: "Quiet Zone", x: 500, y: 40, w: 420, h: 240, fill: "rgba(79,107,184,0.06)" },
  { name: "Group Study", x: 40, y: 320, w: 420, h: 240, fill: "rgba(45,122,79,0.06)" },
  { name: "Discussion Room", x: 500, y: 320, w: 420, h: 240, fill: "rgba(138,79,184,0.06)" },
];

export function WorldCanvas({ selfName }: { selfName: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posRef = useRef({ x: WORLD_W / 2, y: WORLD_H / 2 });
  const keysRef = useRef<Set<string>>(new Set());
  const remotesRef = useRef<RemotePlayer[]>([]);
  const [online, setOnline] = useState(1);
  const [zone, setZone] = useState("the library");

  // Keyboard capture.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        keysRef.current.add(k);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Movement + render loop.
  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const loop = () => {
      const keys = keysRef.current;
      const p = posRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= SPEED;
      if (keys.has("s") || keys.has("arrowdown")) dy += SPEED;
      if (keys.has("a") || keys.has("arrowleft")) dx -= SPEED;
      if (keys.has("d") || keys.has("arrowright")) dx += SPEED;
      p.x = Math.max(AVATAR_R, Math.min(WORLD_W - AVATAR_R, p.x + dx));
      p.y = Math.max(AVATAR_R, Math.min(WORLD_H - AVATAR_R, p.y + dy));

      // Determine current zone.
      const z = ZONES.find((z) => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h);
      if (z) setZone((prev) => (prev === z.name ? prev : z.name));

      draw(ctx, p, remotesRef.current, selfName);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [selfName]);

  // Presence: push my position and pull others.
  const sync = useCallback(async () => {
    const p = posRef.current;
    try {
      await fetch("/api/library/multiplayer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ x: Math.round(p.x), y: Math.round(p.y), roomId: "library" }),
      });
      const r = await fetch("/api/library/multiplayer?roomId=library");
      if (r.ok) {
        const d = await r.json();
        remotesRef.current = d.players ?? [];
        setOnline((d.players ?? []).length || 1);
      }
    } catch {
      /* presence is best-effort */
    }
  }, []);

  useEffect(() => {
    sync();
    const i = setInterval(sync, 1200);
    return () => clearInterval(i);
  }, [sync]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)]">
        <span>
          <span className="font-mono text-xs">WASD</span> to move · {zone}
        </span>
        <span>{online} online</span>
      </div>
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        tabIndex={0}
        aria-label="Virtual library floor. Use W A S D or arrow keys to move your avatar."
        className="h-auto w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background-alt)]"
      />
      <p className="mt-2 text-xs text-[var(--muted-light)]">
        Click the floor to focus it, then use the keys to walk around. Other students who are online
        appear live.
      </p>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  self: { x: number; y: number },
  remotes: RemotePlayer[],
  selfName: string,
) {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);

  // Floor grid.
  ctx.fillStyle = "#faf8f5";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_H);
    ctx.stroke();
  }
  for (let y = 0; y < WORLD_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_W, y);
    ctx.stroke();
  }

  // Zones.
  for (const z of ZONES) {
    ctx.fillStyle = z.fill;
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "12px sans-serif";
    ctx.fillText(z.name, z.x + 10, z.y + 20);

    // A couple of desks per zone.
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(z.x + 40 + i * 120, z.y + z.h - 70, 70, 36);
    }
  }

  // Remote players.
  for (const r of remotes) {
    if (r.label === selfName) continue;
    drawAvatar(ctx, r.x, r.y, COLORS[r.colorIndex % COLORS.length], r.label);
  }

  // Self (always drawn on top, highlighted).
  drawAvatar(ctx, self.x, self.y, "#1a1a1a", `${selfName} (you)`);
}

function drawAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string) {
  ctx.beginPath();
  ctx.arc(x, y, AVATAR_R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - AVATAR_R - 4);
  ctx.textAlign = "left";
}

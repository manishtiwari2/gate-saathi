"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, EmptyState, Input, Textarea } from "@/components/ui";

interface Room {
  id: string;
  name: string;
  description: string | null;
  roomKey: string;
  isOwner: boolean;
  memberCount: number;
}

export function RoomsClient() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"none" | "create" | "join">("none");

  const load = useCallback(async () => {
    const r = await fetch("/api/rooms");
    if (r.ok) setRooms((await r.json()).rooms ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Study Rooms</h1>
          <p className="mt-2 text-[var(--muted)]">Create or join a room to study with friends.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "join" ? "primary" : "secondary"} onClick={() => setMode("join")}>
            Join Room
          </Button>
          <Button variant={mode === "create" ? "primary" : "secondary"} onClick={() => setMode("create")}>
            Create Room
          </Button>
        </div>
      </div>

      {mode === "create" && <CreateRoom onClose={() => setMode("none")} onCreated={(id) => router.push(`/rooms/${id}`)} />}
      {mode === "join" && <JoinRoom onClose={() => setMode("none")} onJoined={(id) => router.push(`/rooms/${id}`)} />}

      <div className="mt-8">
        {loading ? (
          <div className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--background-alt)]" />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            description="Create a room or join one with a room key."
            action={<Button onClick={() => setMode("create")}>Create your first room</Button>}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link href={`/rooms/${r.id}`} className="block h-full">
                  <Card className="h-full transition-colors hover:border-[var(--accent)]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">{r.name}</h2>
                      {r.isOwner && <span className="text-xs text-[var(--accent)]">Owner</span>}
                    </div>
                    {r.description && <p className="mt-1 text-sm text-[var(--muted)]">{r.description}</p>}
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      Key: {r.roomKey} · {r.memberCount} member{r.memberCount === 1 ? "" : "s"}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CreateRoom({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    if (r.ok) {
      onCreated((await r.json()).id);
    } else {
      setError("Could not create the room.");
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create Study Room</h2>
        <button onClick={onClose} aria-label="Close" className="text-[var(--muted)]">
          ✕
        </button>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="rname" className="mb-1 block text-sm font-medium">
            Room Name
          </label>
          <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., CSE Study Group" required />
        </div>
        <div>
          <label htmlFor="rdesc" className="mb-1 block text-sm font-medium">
            Description (optional)
          </label>
          <Textarea id="rdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you studying?" rows={2} />
        </div>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Creating…" : "Create Room"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function JoinRoom({ onClose, onJoined }: { onClose: () => void; onJoined: (id: string) => void }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomKey: key.trim().toUpperCase() }),
    });
    if (r.ok) {
      onJoined((await r.json()).id);
    } else {
      const j = await r.json().catch(() => null);
      setError(j?.error?.message ?? "Could not join the room.");
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Join Study Room</h2>
        <button onClick={onClose} aria-label="Close" className="text-[var(--muted)]">
          ✕
        </button>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="rkey" className="mb-1 block text-sm font-medium">
            Room Key
          </label>
          <Input id="rkey" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g., K7QX4M" required />
        </div>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !key.trim()}>
            {busy ? "Joining…" : "Join Room"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";
import { formatDuration } from "@/lib/utils";

interface RoomInfo {
  id: string;
  name: string;
  description: string | null;
  roomKey: string;
  isOwner: boolean;
}
interface Message {
  id: string;
  body: string;
  userName: string;
  isMine: boolean;
  createdAt: string;
}
interface Member {
  userId: string;
  name: string;
  role: string;
  presence: string;
  isMe: boolean;
}

type Tab = "focus" | "chat" | "members" | "files";

export function RoomDetail({ room }: { room: RoomInfo }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("focus");
  const [copied, setCopied] = useState(false);

  async function leave() {
    if (!confirm(room.isOwner ? "Delete this room for everyone?" : "Leave this room?")) return;
    await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    router.push("/rooms");
  }

  function copyKey() {
    navigator.clipboard?.writeText(room.roomKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{room.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{room.description || "No description"}</p>
          <p className="mt-2 text-sm">
            Room Key: <span className="font-mono font-semibold">{room.roomKey}</span>{" "}
            <button onClick={copyKey} className="ml-2 text-xs text-[var(--accent)] hover:underline">
              {copied ? "Copied!" : "Copy invite key"}
            </button>
          </p>
        </div>
        <Button variant="secondary" onClick={leave}>
          {room.isOwner ? "Delete Room" : "Leave Room"}
        </Button>
      </div>

      <div className="mt-6 inline-flex rounded-lg border border-[var(--border)] p-0.5">
        {(["focus", "chat", "members", "files"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm capitalize ${
              tab === t ? "bg-[var(--accent)] text-white" : "text-[var(--muted)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "focus" && <FocusTimer roomId={room.id} />}
        {tab === "chat" && <RoomChat roomId={room.id} />}
        {tab === "members" && <Members roomId={room.id} />}
        {tab === "files" && <Files roomId={room.id} />}
      </div>
    </div>
  );
}

function FocusTimer({ roomId }: { roomId: string }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  async function end() {
    setRunning(false);
    if (seconds >= 1) {
      await fetch("/api/study/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seconds, subject: subject || undefined, roomId }),
      });
      setSaved(`Saved ${formatDuration(seconds)} of focus time.`);
    }
    setSeconds(0);
  }

  return (
    <Card className="text-center">
      <Input
        className="mx-auto max-w-sm"
        placeholder="What are you studying? (optional)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={running}
      />
      <p className="mt-6 text-xs uppercase tracking-wide text-[var(--muted)]">
        {running ? "In session" : "Ready to focus"}
      </p>
      <p className="mt-2 font-display text-6xl tabular-nums">{formatDuration(seconds)}</p>
      <div className="mt-6 flex justify-center gap-3">
        {!running ? (
          <Button onClick={() => { setRunning(true); setSaved(null); }}>Start Session</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setRunning(false)}>
              Pause
            </Button>
            <Button onClick={end}>End Session</Button>
          </>
        )}
      </div>
      {saved && <p className="mt-4 text-sm text-[var(--success)]">{saved}</p>}
    </Card>
  );
}

function RoomChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const poll = useCallback(async () => {
    const r = await fetch(`/api/rooms/${roomId}/messages`);
    if (r.ok) setMessages((await r.json()).messages ?? []);
  }, [roomId]);

  useEffect(() => {
    poll();
    const i = setInterval(poll, 2500);
    return () => clearInterval(i);
  }, [poll]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    poll();
  }

  return (
    <Card>
      <div className="h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.isMine ? "text-right" : ""}>
              <p className="text-xs text-[var(--muted)]">{m.isMine ? "You" : m.userName}</p>
              <p
                className={`mt-1 inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.isMine ? "bg-[var(--accent)] text-white" : "bg-[var(--background-alt)]"
                }`}
              >
                {m.body}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <Input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}

function Members({ roomId }: { roomId: string }) {
  const [members, setMembers] = useState<Member[]>([]);

  const poll = useCallback(async () => {
    const r = await fetch(`/api/rooms/${roomId}/members`);
    if (r.ok) setMembers((await r.json()).members ?? []);
  }, [roomId]);

  useEffect(() => {
    poll();
    // Heartbeat: mark myself active so others see me online.
    fetch(`/api/rooms/${roomId}/members`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ presence: "active" }),
    });
    const i = setInterval(poll, 5000);
    return () => clearInterval(i);
  }, [poll, roomId]);

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">
        Members ({members.length})
      </h2>
      <ul className="mt-4 space-y-2">
        {members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs text-[var(--accent)]">
                {m.name.slice(0, 2).toUpperCase()}
              </span>
              <span>
                {m.name}
                {m.isMe && " (you)"}
                {m.role === "owner" && <span className="ml-1 text-xs text-[var(--accent)]">Owner</span>}
              </span>
            </span>
            <span className="text-xs capitalize text-[var(--muted)]">{m.presence}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Files({ roomId }: { roomId: string }) {
  const [files, setFiles] = useState<Array<{ id: string; name: string; fileSize: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/files`)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => setFiles(d.files ?? []))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">Shared files</h2>
      {loading ? (
        <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
      ) : files.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">
          No files shared yet. The room owner can share files from their storage.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between text-sm">
              <span>{f.name}</span>
              <span className="text-xs text-[var(--muted)]">{Math.round(f.fileSize / 1024)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

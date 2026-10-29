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
  online: boolean;
}

type Tab = "focus" | "chat" | "members" | "files";

export function RoomDetail({ room }: { room: RoomInfo }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("focus");
  const [copied, setCopied] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Heartbeat while the room page is open, whichever tab is showing, so
  // other members see this user as online.
  useEffect(() => {
    const beat = () =>
      fetch(`/api/rooms/${room.id}/members`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presence: "active" }),
      }).catch(() => {});
    beat();
    const i = setInterval(beat, 30_000);
    return () => clearInterval(i);
  }, [room.id]);

  async function leave() {
    if (!confirm(room.isOwner ? "Delete this room for everyone?" : "Leave this room?")) return;
    setLeaveError(null);
    const r = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" }).catch(() => null);
    if (!r?.ok) {
      setLeaveError("Couldn't leave the room. Please try again.");
      return;
    }
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
        <div className="text-right">
          <Button variant="secondary" onClick={leave}>
            {room.isOwner ? "Delete Room" : "Leave Room"}
          </Button>
          {leaveError && <p className="mt-2 text-xs text-[var(--error)]">{leaveError}</p>}
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-lg border border-[var(--border)] p-0.5" role="tablist">
        {(["focus", "chat", "members", "files"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm capitalize ${
              tab === t ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {/* The timer stays mounted while other tabs are open, so a running
            session isn't lost by switching tabs. */}
        <div hidden={tab !== "focus"}>
          <FocusTimer roomId={room.id} />
        </div>
        {tab === "chat" && <RoomChat roomId={room.id} />}
        {tab === "members" && <Members roomId={room.id} />}
        {tab === "files" && <Files roomId={room.id} />}
      </div>
    </div>
  );
}

function FocusTimer({ roomId }: { roomId: string }) {
  // Elapsed time is computed from timestamps rather than counted interval
  // ticks, because browsers throttle timers in background tabs.
  const [startedAt, setStartedAt] = useState<number | null>(null); // running since
  const [banked, setBanked] = useState(0); // ms from earlier, paused stretches
  const [now, setNow] = useState(() => Date.now());
  const [subject, setSubject] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const running = startedAt !== null;
  const seconds = Math.floor((banked + (startedAt ? now - startedAt : 0)) / 1000);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [running]);

  // Save an unfinished session if the page is closed or navigated away from.
  const pending = useRef({ seconds: 0, subject: "" });
  pending.current = { seconds, subject };
  useEffect(() => {
    const flush = () => {
      const { seconds: s, subject: subj } = pending.current;
      if (s < 1) return;
      pending.current.seconds = 0;
      const body = JSON.stringify({ seconds: s, subject: subj || undefined, roomId });
      navigator.sendBeacon?.("/api/study/sessions", new Blob([body], { type: "application/json" }));
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush(); // in-app navigation unmounts the room page
    };
  }, [roomId]);

  function start() {
    setSaved(null);
    setNow(Date.now());
    setStartedAt(Date.now());
  }

  function pause() {
    if (startedAt) setBanked((b) => b + (Date.now() - startedAt));
    setStartedAt(null);
  }

  async function end() {
    const total = seconds;
    setStartedAt(null);
    setBanked(0);
    pending.current.seconds = 0;
    if (total < 1) return;
    const r = await fetch("/api/study/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seconds: total, subject: subject || undefined, roomId }),
    }).catch(() => null);
    setSaved(r?.ok ? `Saved ${formatDuration(total)} of focus time.` : "Couldn't save this session. Please try again.");
  }

  return (
    <Card className="text-center">
      <label htmlFor="focus-subject" className="sr-only">
        What are you studying? (optional)
      </label>
      <Input
        id="focus-subject"
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
          <>
            <Button onClick={start}>{seconds > 0 ? "Resume" : "Start Session"}</Button>
            {seconds > 0 && <Button onClick={end}>End Session</Button>}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={pause}>
              Pause
            </Button>
            <Button onClick={end}>End Session</Button>
          </>
        )}
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-[var(--success)]">
        {saved}
      </p>
    </Card>
  );
}

function RoomChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const poll = useCallback(async () => {
    const r = await fetch(`/api/rooms/${roomId}/messages`);
    if (r.ok) setMessages((await r.json()).messages ?? []);
  }, [roomId]);

  useEffect(() => {
    poll();
    const i = setInterval(poll, 4000); // each poll is a server request; keep within free hosting quotas
    return () => clearInterval(i);
  }, [poll]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSendError(null);
    const r = await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    }).catch(() => null);
    // Keep the draft if sending failed so it isn't lost.
    if (!r?.ok) {
      setSendError("Message not sent. Please try again.");
      return;
    }
    setText("");
    poll();
  }

  return (
    <Card>
      <div className="h-80 space-y-3 overflow-y-auto" aria-live="polite">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.isMine ? "text-right" : ""}>
              <p className="text-xs text-[var(--muted)]">{m.isMine ? "You" : m.userName}</p>
              <p
                className={`mt-1 inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.isMine ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-[var(--background-alt)]"
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
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <Input id="chat-input" placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
      </form>
      {sendError && <p className="mt-2 text-xs text-[var(--error)]">{sendError}</p>}
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
    const i = setInterval(poll, 5000);
    return () => clearInterval(i);
  }, [poll]);

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
            <span className="flex items-center gap-1.5 text-xs capitalize text-[var(--muted)]">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${m.online ? "bg-[var(--success)]" : "bg-[var(--muted-light)]"}`}
              />
              {m.online ? m.presence : "offline"}
            </span>
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

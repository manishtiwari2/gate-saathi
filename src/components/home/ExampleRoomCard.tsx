import { Badge } from "@/components/ui";

/** Decorative hero illustration: an example study room. Static, labelled as an example. */
export function ExampleRoomCard() {
  const members = [
    { initials: "AA", name: "Aarav", status: "Focusing" },
    { initials: "PR", name: "Priya", status: "Focusing" },
    { initials: "RO", name: "Rohan", status: "Focusing" },
    { initials: "SN", name: "Sneha", status: "On a break" },
  ];
  return (
    <figure
      aria-label="Example study room: four friends studying together with a focus timer and chat"
      className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--background-alt)] p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">GATE CS 2027 Squad</span>
            <Badge>Private</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">Room key: K7QX4M</p>
        </div>
        <span className="text-sm text-[var(--muted)]">4 in room</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">In session</p>
          <p className="mt-2 font-display text-3xl">42:17</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Studying: DBMS</p>
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li key={m.initials} className="flex items-center gap-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs text-[var(--accent)]">
                  {m.initials}
                </span>
                <span className="flex-1">{m.name}</span>
                <span className="text-xs text-[var(--muted)]">{m.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Room chat</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li>
              <span className="font-medium">Priya</span>
              <p className="text-[var(--muted)]">Stuck on the normalization PYQ. A → BC, B → D, C → E. Is it 2NF?</p>
            </li>
            <li>
              <span className="font-medium">Rohan</span>
              <p className="text-[var(--muted)]">A is the key, so no partial dependency: it&apos;s 2NF. B → D is transitive, so not 3NF.</p>
            </li>
            <li>
              <span className="font-medium">You</span>
              <p className="text-[var(--muted)]">Doing the DBMS set next. Join after this session?</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[var(--accent-subtle)] px-3 py-2 text-sm text-[var(--accent)]">
        Shared file: dbms-normal-forms-notes.pdf
      </div>
      <figcaption className="mt-3 text-center text-xs text-[var(--muted-light)]">
        Illustration only. Names, messages, and the room key are examples.
      </figcaption>
    </figure>
  );
}

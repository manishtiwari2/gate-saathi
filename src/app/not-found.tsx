import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl text-[var(--accent)]">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page could not be found.</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        The page you are looking for does not exist or has moved.
      </p>
      <ButtonLink href="/" className="mt-6">Back to home</ButtonLink>
    </div>
  );
}

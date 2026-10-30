import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { DEV_LOGIN_COOKIE, isDevLoginEnabled } from "@/lib/auth";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(80).optional(),
});

/** Local dev login: any email, no password. Never available in production. */
export async function POST(req: Request) {
  if (!isDevLoginEnabled) return fail(404, "NOT_FOUND", "Not found");

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return fail(400, "BAD_REQUEST", "Enter a valid email");
  const { email, name } = body.data;

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: name || email.split("@")[0] },
  });
  (await cookies()).set(DEV_LOGIN_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return ok({ signedIn: true });
}

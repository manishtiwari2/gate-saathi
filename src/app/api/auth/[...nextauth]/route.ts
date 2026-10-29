import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

type Ctx = { params: Promise<{ nextauth: string[] }> };

// Sign-in attempts go through POST; throttle them per IP.
async function POST(req: Request, ctx: Ctx) {
  const limited = rateLimit("auth", clientIp(req), 20, 60_000);
  if (limited) return limited;
  return handler(req, ctx);
}

export { handler as GET, POST };

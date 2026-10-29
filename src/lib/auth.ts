import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

const providers: NextAuthOptions["providers"] = [];

// Real Google sign-in when credentials are configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Local dev login (no external service). It accepts any email with no password,
// so it is never available in production, whatever ENABLE_DEV_LOGIN says.
export const isDevLoginEnabled =
  process.env.ENABLE_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

if (isDevLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: "dev",
      name: "Dev login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        name: { label: "Display name", type: "text", placeholder: "Your name" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email) return null;
        const displayName = credentials?.name?.trim() || email.split("@")[0];
        const user = await db.user.upsert({
          where: { email },
          update: {},
          create: { email, displayName },
        });
        return { id: user.id, email: user.email, name: user.displayName, image: user.avatarUrl };
      },
    }),
  );
}

// The stock adapter writes name/image/emailVerified, which our User model does
// not have. Map OAuth profiles onto displayName/avatarUrl instead, and let the
// adapter create the user so it can link the Google Account in the same step.
const baseAdapter = PrismaAdapter(db);
const adapter: Adapter = {
  ...baseAdapter,
  async createUser(data: Omit<AdapterUser, "id">) {
    const user = await db.user.create({
      data: {
        email: data.email,
        displayName: data.name ?? data.email.split("@")[0],
        avatarUrl: data.image ?? undefined,
      },
    });
    return { id: user.id, email: user.email, emailVerified: null, name: user.displayName, image: user.avatarUrl };
  },
};

export const authOptions: NextAuthOptions = {
  adapter,
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      // Refresh the avatar for returning Google users. Never create the user
      // here (the adapter does that) and never overwrite a name they edited.
      if (account?.provider === "google" && user.email && user.image) {
        await db.user.updateMany({ where: { email: user.email }, data: { avatarUrl: user.image } });
      }
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await db.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.uid = dbUser.id;
          token.plan = dbUser.plan;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const isGoogleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

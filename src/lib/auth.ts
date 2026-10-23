import type { NextAuthOptions } from "next-auth";
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

// Local dev login (no external service). Disabled unless explicitly enabled.
if (process.env.ENABLE_DEV_LOGIN === "true") {
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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, profile }) {
      // Ensure a User row exists / is updated for Google sign-ins.
      if (user.email) {
        await db.user.upsert({
          where: { email: user.email },
          update: {
            displayName: user.name ?? profile?.name ?? user.email.split("@")[0],
            avatarUrl: user.image ?? undefined,
          },
          create: {
            email: user.email,
            displayName: user.name ?? user.email.split("@")[0],
            avatarUrl: user.image ?? undefined,
          },
        });
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
export const isDevLoginEnabled = process.env.ENABLE_DEV_LOGIN === "true";

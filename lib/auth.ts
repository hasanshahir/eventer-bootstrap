import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { env } from "./env";
import { sendTransactionalEmail } from "./email";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      role: Role;
      city?: string | null;
      university?: string | null;
    };
  }

  interface User {
    role?: Role;
    city?: string | null;
    university?: string | null;
    fullName?: string | null;
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
    error: "/login",
  },
  providers: [
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            checks: ["pkce", "state"],
            allowDangerousEmailAccountLinking: false,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name || profile.email?.split("@")[0] || "Developer",
                fullName: profile.name || profile.email?.split("@")[0] || "Developer",
                email: profile.email,
                image: profile.picture || null,
                role: "USER" as Role,
              };
            },
          }),
        ]
      : []),
    {
      id: "resend",
      name: "Email Magic Link",
      type: "email",
      maxAge: 15 * 60, // 15 minutes
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        await sendTransactionalEmail({
          to: email,
          subject: "Sign in to Eventr — Pakistan's Tech Event Radar",
          url,
          html: `
            <div style="font-family: monospace; max-width: 540px; margin: 0 auto; padding: 24px; border: 2px solid #160d08; background: #fbf6ee; color: #160d08;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #2563eb; margin: 0 0 8px;">Eventr Dispatch • Magic Sign-In Link</p>
              <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 16px;">Sign in to your developer account</h1>
              <p style="font-size: 13px; line-height: 1.6; margin: 0 0 24px;">Click the button below to complete your sign-in. This one-time link expires in 15 minutes.</p>
              <p style="margin: 0 0 24px;">
                <a href="${url}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; border: 1px solid #160d08;">Sign In to Eventr &rarr;</a>
              </p>
              <p style="font-size: 11px; color: #5b4d42;">If you did not request this email, you can safely ignore it.</p>
            </div>
          `,
        });
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user.role as Role) || "USER";
        session.user.name = user.name || user.fullName || user.email.split("@")[0];
        session.user.city = user.city ?? null;
        session.user.university = user.university ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id && !user.fullName) {
        const defaultName = user.name || user.email?.split("@")[0] || "Developer";
        await prisma.user
          .update({
            where: { id: user.id },
            data: {
              fullName: defaultName,
              name: user.name || defaultName,
            },
          })
          .catch(() => {});
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);


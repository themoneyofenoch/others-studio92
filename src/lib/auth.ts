import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    // We render our own inline login UI — no separate page needed
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const adminEmail = process.env.ADMIN_EMAIL || "admin@studio92braids.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "studio92";
        if (
          credentials.email.trim().toLowerCase() === adminEmail.toLowerCase() &&
          credentials.password === adminPassword
        ) {
          return {
            id: "1",
            email: adminEmail,
            name: "Studio 92 Admin",
            role: "admin",
          } as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "admin";
        token.email = user.email!;
        token.name = user.name || "Admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).name = token.name;
        (session.user as any).email = token.email;
      }
      return session;
    },
  },
};

export async function isAdminRequest(req: Request) {
  // Lightweight check used by API routes — we accept NextAuth session cookie
  const cookie = req.headers.get("cookie") || "";
  return cookie.includes("next-auth.session-token") || cookie.includes("__Secure-next-auth.session-token");
}

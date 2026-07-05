import type { NextAuthOptions } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@prisma/client'
import { db } from './db'

/**
 * NextAuth configuration — GitHub + Google OAuth.
 *
 * Env vars required:
 *   NEXTAUTH_SECRET          — random 32-char string
 *   GITHUB_CLIENT_ID         — from https://github.com/settings/developers
 *   GITHUB_CLIENT_SECRET     — from GitHub OAuth App settings
 *   GOOGLE_CLIENT_ID         — from https://console.cloud.google.com/apis/credentials
 *   GOOGLE_CLIENT_SECRET     — from Google Cloud Console
 *
 * OAuth App callback URLs:
 *   GitHub:  http://localhost:3000/api/auth/callback/github
 *   Google:  http://localhost:3000/api/auth/callback/google
 */

const prismaAdapter = new PrismaAdapter(db as any)

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter as any,
  session: {
    strategy: 'jwt', // JWT strategy works better with SQLite
  },
  providers: [
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}

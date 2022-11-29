import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db/client";
import { User } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  // Include user.id on session
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    // CredentialsProvider({
    //   id: "credentialsProvider",
    //   name: "Credentials",
    //   type: "credentials",
    //   credentials: {
    //     email: { label: "Email", type: "text", placeholder: "jsmith" },
    //     password: { label: "Password", type: "password" },
    //   },
    //   async authorize(credentials, req) {
    //     // You need to provide your own logic here that takes the credentials
    //     // submitted and returns either a object representing a user or value
    //     // that is false/null if the credentials are invalid.
    //     // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
    //     // You can also use the `req` object to obtain additional parameters
    //     // (i.e., the request IP address)

    //     // this should be a trpc call to prisma

    //     const dbUser: User | null = await prisma.user.findUnique({
    //       where: {
    //         email: credentials?.email,
    //       },
    //     });

    //     if (dbUser) {
    //       console.log(dbUser);
    //       if (dbUser.password === credentials?.password) {
    //         return dbUser;
    //       }
    //     }
    //     // Return null if user data could not be retrieved
    //     return null;

    //     // const res = await fetch("/your/endpoint", {
    //     //   method: "POST",
    //     //   body: JSON.stringify(credentials),
    //     //   headers: { "Content-Type": "application/json" },
    //     // });
    //     // const user = await res.json();

    //     // // If no error and we have user data, return it
    //     // if (res.ok && user) {
    //     //   return user;
    //     // }
    //   },
    // }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
};

export default NextAuth(authOptions);

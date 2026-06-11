import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";

declare module "next-auth" {
  interface Session {
    id?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({
      user: { name, email, image },
      profile,
    }) {
      const githubProfile = profile as any;
      const id = githubProfile?.id;
      const login = githubProfile?.login;
      const bio = githubProfile?.bio;

      let existingUser: any;
      try {
        existingUser = await client
          .withConfig({ useCdn: false })
          .fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id });
      } catch (err) {
        console.warn("Sanity fetch failed in signIn callback:", err);
      }

      if (!existingUser) {
        if (process.env.SANITY_WRITE_TOKEN) {
          try {
            await writeClient.create({
              _type: "author",
              id,
              name,
              username: login,
              email,
              image,
              bio: bio || "",
            });
          } catch (err) {
            console.error("Failed to create author in Sanity:", err);
          }
        } else {
          console.warn("SANITY_WRITE_TOKEN not set — skipping author creation.");
        }
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const githubProfile = profile as any;
        let user: any;
        try {
          user = await client
            .withConfig({ useCdn: false })
            .fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
              id: githubProfile?.id,
            });
        } catch (err) {
          console.warn("Sanity fetch failed in jwt callback:", err);
        }
        token.id = user?._id || `github-${githubProfile?.id}`;
      }

      return token;
    },
    async session({ session, token }) {
      Object.assign(session, { id: token.id });
      return session;
    },
  },
});
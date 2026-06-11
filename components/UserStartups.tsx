import React from "react";
import { client } from "@/sanity/lib/client";
import { STARTUPS_BY_AUTHOR_QUERY } from "@/sanity/lib/queries";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";

const UserStartups = async ({ id, username }: { id: string; username?: string }) => {
  let startups = [] as any[];
  try {
    startups = await client.fetch(STARTUPS_BY_AUTHOR_QUERY, { id });
  } catch (err) {
    console.warn("Sanity fetch failed for user startups; using fallback:", err);
  }

  if (!startups || startups.length === 0) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
        const raw = await fs.readFile(dataPath, "utf8");
        const list = JSON.parse(raw || "[]");
        const githubId = id.startsWith("github-") ? id.replace("github-", "") : null;
        const authorList = list.filter((s: any) =>
          s.author?._id === id ||
          s.author?.id === id ||
          s.author?.id?.toString() === id ||
          (githubId && s.author?.id?.toString() === githubId) ||
          (username && (s.author?.name === username || s.author?.username === username)) ||
          s.author?.name === id ||
          s.author?.username === id
        );
        if (authorList && authorList.length) {
          startups = authorList;
        }
      } catch (e) {
        // ignore
      }
  }

  return (
    <>
      {startups.length > 0 ? (
        startups.map((startup: StartupTypeCard) => (
          <StartupCard key={startup._id} post={startup} />
        ))
      ) : (
        <p className="no-result">No posts yet</p>
      )}
    </>
  );
};
export default UserStartups;

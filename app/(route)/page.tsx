//import Image from "next/image";

import SearchForm from "../../components/SearchForm";
import StartupCard from "@/components/StartupCard";
import { STARTUPS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch, SanityLive } from "@/sanity/lib/live";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const query = (await searchParams).query;
  const params = { search: query || null };

  let posts: any[] = [];
  try {
    const result: any = await sanityFetch({ query: STARTUPS_QUERY, params });
    posts = result?.data || [];
  } catch (err) {
    console.warn("sanityFetch failed, falling back to local data:", err);
  }
  // Merge local dev-created startups so they appear when Sanity is unavailable
  let shownPosts = posts || [];
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
    const raw = await fs.readFile(dataPath, "utf8").catch(() => "[]");
    const localList = JSON.parse(raw || "[]");
    if (Array.isArray(localList) && localList.length > 0) {
      const existingIds = new Set(shownPosts.map((p: any) => p._id));
      const toAdd: any[] = [];
      for (const s of localList) {
        if (!existingIds.has(s._id)) {
          existingIds.add(s._id);
          toAdd.push(s);
        }
      }
      if (toAdd.length) shownPosts = [...toAdd, ...shownPosts];
    }
  } catch (e) {
    // ignore - keep shownPosts as fetched from Sanity
  }

  // Merge real view counts from local tracking
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const viewsPath = path.join(process.cwd(), "data", "dev-views.json");
    const viewsRaw = await fs.readFile(viewsPath, "utf8").catch(() => "{}");
    const localViews = JSON.parse(viewsRaw || "{}");
    shownPosts = shownPosts.map((p: any) => ({
      ...p,
      views: localViews[p._id] ?? p.views ?? 0,
    }));
  } catch (e) {
    // ignore
  }

  // Filter local data by search query (mirrors the GROQ query logic)
  if (query) {
    const q = query.toLowerCase();
    shownPosts = shownPosts.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.author?.name?.toLowerCase().includes(q)
    );
  }

  return (
    <>
      <section className="pink_container">
        <h1 className="heading">
          Pitch Your Startup <br /> Connect With Entrepreneurs
        </h1>

        <p className="sub-heading !max-w-3xl">
          Submit Ideas, Vote on Pitches, and Get Noticed in Virtual
          Competitions.
        </p>

        <SearchForm query={query} />
      </section>

      <section className="section_container">
        <p className="text-30-semibold">
          {query ? `Search results for "${query}"` : "All Startups"}
        </p>

        <ul className="mt-7 card_grid">
          {shownPosts.length > 0 ? (
            shownPosts.map((post: any) => (
              <StartupCard key={post?._id} post={post} />
            ))
          ) : (
            <p className="no-results">No startups found</p>
          )}
        </ul>
      </section>

      <SanityLive />
    </>
  );
}

import { auth } from "@/auth";
import { client } from "@/sanity/lib/client";
import { AUTHOR_BY_ID_QUERY } from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import Image from "next/image";
import UserStartups from "@/components/UserStartups";
import { Suspense } from "react";
import { StartupCardSkeleton } from "@/components/StartupCard";

export const experimental_ppr = true;

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const session = await auth();

  let user = null;
  try {
    user = await client.fetch(AUTHOR_BY_ID_QUERY, { id });
  } catch (err) {
    console.warn("Sanity fetch failed for author; using fallback:", err);
  }

  if (!user) {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const dataPath = path.join(process.cwd(), "data", "dev-authors.json");
      const raw = await fs.readFile(dataPath, "utf8").catch(() => "[]");
      const localAuthors = JSON.parse(raw || "[]");
      const githubId = id.startsWith("github-") ? id.replace("github-", "") : null;
      const found = localAuthors.find((a: any) =>
        a._id === id || a.id?.toString() === id || (githubId && a.id?.toString() === githubId)
      );
      if (found) user = found;
    } catch (e) {
      // ignore
    }
  }

  if (!user && session?.user) {
    user = {
      _id: id,
      name: session.user.name || "Unknown User",
      image: session.user.image || "/logo.png",
      username: (session as any)?.username || session.user.name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
      bio: "",
    } as any;
  }

  if (!user) {
    user = {
      _id: id,
      name: "Unknown User",
      image: "/logo.png",
      username: "unknown",
      bio: "",
    } as any;
  }

  return (
    <>
      <section className="profile_container">
        <div className="profile_card">
          <div className="profile_title">
            <h3 className="text-24-black uppercase text-center line-clamp-1">
              {user.name}
            </h3>
          </div>

          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={220}
              height={220}
              className="profile_image"
            />
          ) : (
            <div className="w-[220px] h-[220px] rounded-full bg-gray-200 mx-auto" aria-hidden />
          )}

          <p className="text-30-extrabold mt-7 text-center">
            @{user?.username}
          </p>
          <p className="mt-1 text-center text-14-normal">{user?.bio}</p>
        </div>

        <div className="flex-1 flex flex-col gap-5 lg:-mt-5">
          <p className="text-30-bold">
            {session?.id === id ? "Your" : "All"} Startups
          </p>
          <ul className="card_grid-sm">
            <Suspense fallback={<StartupCardSkeleton />}>
              <UserStartups id={id} username={user?.name || session?.user?.name} />
            </Suspense>
          </ul>
        </div>
      </section>
    </>
  );
};

export default Page;

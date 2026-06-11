import { Suspense } from "react";
import { client } from "@/sanity/lib/client";
import {
  STARTUP_BY_ID_QUERY,
} from "@/sanity/lib/queries";
import { notFound } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

import markdownit from "markdown-it";
import { Skeleton } from "@/components/ui/skeleton";
import View from "@/components/View";
import StartupCard, { StartupTypeCard } from "@/components/StartupCard";

const md = markdownit();

export const experimental_ppr = true;

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;

  let post = null;
  try {
    post = await client.fetch(STARTUP_BY_ID_QUERY, { id });
  } catch (err) {
    console.warn("Sanity fetch failed for startup; using fallback:", err);
  }

  if (!post) {
    try {
      const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
      const raw = await fs.readFile(dataPath, "utf8");
      const list = JSON.parse(raw || "[]");
      const found = list.find((s: any) => s._id === id);
      if (found) {
        post = found;
        const viewsPath = path.join(process.cwd(), "data", "dev-views.json");
        const viewsRaw = await fs.readFile(viewsPath, "utf8").catch(() => "{}");
        const localViews = JSON.parse(viewsRaw || "{}");
        post.views = localViews[id] || post.views || 0;
      }
    } catch (err) {
      // ignore
    }

    if (!post) {
      post = {
      _createdAt: new Date().toISOString(),
      title: "Sample Startup",
      description:
        "This is a sample startup used for local development when the Sanity dataset is empty.",
      image: "/logo.png",
      author: {
        _id: "sample-author",
        image: "/logo.png",
        name: "Demo Founder",
        username: "sample-author",
      },
      category: "Tech",
      pitch: "This is a sample pitch for local development.",
      } as any;
    }
  }

  const parsedContent = md.render(post?.pitch || "");

  return (
    <>
      <section className="pink_container !min-h-[230px]">
        <p className="tag">{formatDate(post?._createdAt)}</p>

        <h1 className="heading">{post.title}</h1>
        <p className="sub-heading !max-w-5xl">{post.description}</p>
      </section>

      <section className="section_container">
        {post.image ? (
          <div className="relative w-full h-96 rounded-xl overflow-hidden">
            <Image
              src={post.image}
              alt={post.title || "Startup image"}
              fill
              className="object-cover"
              unoptimized={post.image.startsWith("data:")}
            />
          </div>
        ) : (
          <div className="w-full h-48 rounded-xl bg-gray-100" aria-hidden />
        )}

        <div className="space-y-5 mt-10 max-w-4xl mx-auto">
          <div className="flex-between gap-5">
            <Link
              href={`/user/${post.author?._id || "#"}`}
              className="flex gap-2 items-center mb-3"
            >
              {post?.author?.image ? (
                <Image
                  src={post.author.image}
                  alt="avatar"
                  width={64}
                  height={64}
                  className="rounded-full drop-shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200" aria-hidden />
              )}

              <div>
                <p className="text-20-medium">{post.author?.name || "Unknown"}</p>
                <p className="text-16-medium !text-black-300">
                  @{post.author?.username || "unknown"}
                </p>
              </div>
            </Link>

            <p className="category-tag">{post.category}</p>
          </div>

          <h3 className="text-30-bold">Pitch Details</h3>
          {parsedContent ? (
            <article
              className="prose max-w-4xl font-work-sans break-all"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
            />
          ) : (
            <p className="no-result">No details provided</p>
          )}
        </div>

        <hr className="divider" />

        <Suspense fallback={<Skeleton className="view-skeleton" />}>
          <View id={id} />
        </Suspense>
      </section>
    </>
  );
};

export default Page;

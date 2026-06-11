"use server";

import { auth } from "@/auth";
import { parseServerActionResponse } from "@/lib/utils";
import slugify from "slugify";
import { writeClient } from "@/sanity/lib/write-client";
import fs from "fs/promises";
import path from "path";

// sanitize text to remove stack traces and long error dumps
function sanitizeText(input: any) {
  if (typeof input !== "string") return "";
  // remove lines that look like stack traces or debug output
  const lines = input.split(/\r?\n/);
  const filtered = lines.filter((l) => {
    const t = l.trim();
    if (!t) return false;
    if (/^#+\s*Error/i.test(t)) return false;
    if (/^Error:/i.test(t)) return false;
    if (/^at\s+/i.test(t)) return false;
    if (/^\s*\w+\.tsx?:\d+:\d+/i.test(t)) return false;
    // drop extremely long lines that look like dumps
    if (t.length > 2000) return false;
    return true;
  });
  const out = filtered.join("\n").trim();
  // cap length
  return out.length > 2000 ? out.slice(0, 2000) + "…" : out;
}

function sanitizeImageLink(link: any) {
  if (!link) return "";
  if (typeof link !== "string") return "";
  // allow http(s) and data URLs
  if (/^(https?:)?\/\//i.test(link) || /^data:image\//i.test(link)) return link;
  return "";
}

export const createPitch = async (
  state: any,
  form: FormData,
  pitch: string,
) => {
  const session = await auth();
  // In development, allow a fallback local session so authors can create without OAuth
  let effectiveSession = session;
  if (!effectiveSession && process.env.NODE_ENV === "development") {
    effectiveSession = {
      id: "local-dev",
      user: { name: "Local Dev" },
    } as any;
  }

  if (!effectiveSession)
    return parseServerActionResponse({
      error: "Not signed in",
      status: "ERROR",
    });

  const { title, description, category, link } = Object.fromEntries(
    Array.from(form).filter(([key]) => key !== "pitch"),
  );

  const slug = slugify(title as string, { lower: true, strict: true });

  try {
    const startup = {
      title,
      description,
      category,
      image: link,
      slug: {
        _type: "slug",
        current: slug,
      },
      author: {
        _type: "reference",
        _ref: effectiveSession?.id,
      },
      pitch,
    };

    // Try to write to Sanity; if permissions missing, fallback to local dev storage
    try {
      const result = await writeClient.create({ _type: "startup", ...startup });

      // In development, also persist a local copy so the homepage shows the new item immediately
      if (process.env.NODE_ENV === "development") {
        try {
          const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
          let listRaw = "[]";
          try {
            listRaw = await fs.readFile(dataPath, "utf8");
          } catch (e) {
            listRaw = "[]";
          }
          const list = JSON.parse(listRaw || "[]");
          const localCopy = {
            _id: result._id || slug,
            _createdAt: result._createdAt || new Date().toISOString(),
            title: sanitizeText(result.title) || sanitizeText(title) || String(title || "Untitled"),
            description: sanitizeText(result.description) || sanitizeText(description) || "",
            category: String(result.category || category || "General"),
            image: sanitizeImageLink(result.image || link),
            slug: { current: (result.slug && result.slug.current) || slug },
            author: { _id: effectiveSession?.id, name: (effectiveSession as any)?.user?.name || "", image: (effectiveSession as any)?.user?.image || "/logo.png", username: (effectiveSession as any)?.user?.name || "" },
            pitch: sanitizeText(result.pitch) || sanitizeText(pitch) || "",
            views: (result as any).views ?? 0,
          };
          list.unshift(localCopy);
          await fs.mkdir(path.dirname(dataPath), { recursive: true });
          await fs.writeFile(dataPath, JSON.stringify(list, null, 2), "utf8");

          // Save/update the author in dev-authors.json so the profile page works
          try {
            const authorsPath = path.join(process.cwd(), "data", "dev-authors.json");
            let authorsRaw = "[]";
            try { authorsRaw = await fs.readFile(authorsPath, "utf8"); } catch (e) { authorsRaw = "[]"; }
            const authors = JSON.parse(authorsRaw || "[]");
            const existingIdx = authors.findIndex((a: any) => a._id === effectiveSession?.id);
            const authorEntry = {
              _id: effectiveSession?.id,
              id: null,
              name: (effectiveSession as any)?.user?.name || "",
              username: (effectiveSession as any)?.user?.name || "",
              email: "",
              image: (effectiveSession as any)?.user?.image || "/logo.png",
              bio: "",
            };
            if (existingIdx >= 0) {
              authors[existingIdx] = { ...authors[existingIdx], ...authorEntry };
            } else {
              authors.push(authorEntry);
            }
            await fs.writeFile(authorsPath, JSON.stringify(authors, null, 2), "utf8");
          } catch (e) {
            // non-fatal
          }
        } catch (e) {
          // non-fatal
          console.warn("Failed to write local copy after Sanity create:", e);
        }
      }

      return parseServerActionResponse({
        ...result,
        error: "",
        status: "SUCCESS",
      });
    } catch (err) {
      console.log("createPitch writeClient error, falling back to local dev store:", err);

      // Save to local dev JSON file so created startups are visible locally
      try {
        const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
        let listRaw = "[]";
        try {
          listRaw = await fs.readFile(dataPath, "utf8");
        } catch (e) {
          // file may not exist yet
          listRaw = "[]";
        }

        const list = JSON.parse(listRaw || "[]");

        // sanitize existing entries before writing
        const sanitizedList = Array.isArray(list)
          ? list.map((s: any) => ({
              ...s,
              title: sanitizeText(s.title) || s.title,
              description: sanitizeText(s.description) || "",
              pitch: sanitizeText(s.pitch) || "",
              image: sanitizeImageLink(s.image) || "",
            }))
          : [];

        const newStartup = {
          _id: slug,
          _createdAt: new Date().toISOString(),
          title: sanitizeText(title) || String(title || "Untitled"),
          description: sanitizeText(description) || "",
          category: String(category || "General"),
          image: sanitizeImageLink(link),
          slug: { current: slug },
          author: { _id: effectiveSession?.id, name: (effectiveSession as any)?.user?.name || "", username: (effectiveSession as any)?.user?.name || "" },
          pitch: sanitizeText(pitch) || "",
          views: 0,
        };

        sanitizedList.unshift(newStartup);
        await fs.mkdir(path.dirname(dataPath), { recursive: true });
        await fs.writeFile(dataPath, JSON.stringify(sanitizedList, null, 2), "utf8");

        // Save/update the author in dev-authors.json so the profile page works
        try {
          const authorsPath = path.join(process.cwd(), "data", "dev-authors.json");
          let authorsRaw = "[]";
          try { authorsRaw = await fs.readFile(authorsPath, "utf8"); } catch (e) { authorsRaw = "[]"; }
          const authors = JSON.parse(authorsRaw || "[]");
          const existingIdx = authors.findIndex((a: any) => a._id === effectiveSession?.id);
          const authorEntry = {
            _id: effectiveSession?.id,
            id: null,
            name: (effectiveSession as any)?.user?.name || "",
            username: (effectiveSession as any)?.user?.name || "",
            email: "",
            image: (effectiveSession as any)?.user?.image || "/logo.png",
            bio: "",
          };
          if (existingIdx >= 0) {
            authors[existingIdx] = { ...authors[existingIdx], ...authorEntry };
          } else {
            authors.push(authorEntry);
          }
          await fs.writeFile(authorsPath, JSON.stringify(authors, null, 2), "utf8");
        } catch (e) {
          // non-fatal
        }

        return parseServerActionResponse({ ...newStartup, error: "", status: "SUCCESS" });
      } catch (writeErr) {
        console.error("Failed to write fallback startup to local dev store:", writeErr);
        throw err; // rethrow original to be handled below
      }
    }
  } catch (error) {
    console.log("createPitch error:", error);

    // Detect insufficient permissions from Sanity API and return a friendly message
    const isPermissionError =
      (error as any)?.response?.statusCode === 403 ||
      (error as any)?.details?.description?.includes("Insufficient permissions") ||
      (error as any)?.message?.includes("Insufficient permissions");

    if (isPermissionError) {
      return parseServerActionResponse({
        error:
          "Sanity write failed: missing or insufficient write permissions. Please set SANITY_WRITE_TOKEN with write/create permissions.",
        status: "ERROR",
      });
    }

    return parseServerActionResponse({
      error: "An unexpected error occurred while creating the startup.",
      status: "ERROR",
    });
  }
};

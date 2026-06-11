import Ping from "@/components/Ping";
import { client } from "@/sanity/lib/client";
import { STARTUP_VIEWS_QUERY } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/write-client";
import fs from "fs/promises";
import path from "path";

const VIEWS_FILE = path.join(process.cwd(), "data", "dev-views.json");

async function getLocalViews(): Promise<Record<string, number>> {
  try {
    const raw = await fs.readFile(VIEWS_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function saveLocalViews(views: Record<string, number>) {
  try {
    await fs.mkdir(path.dirname(VIEWS_FILE), { recursive: true });
    await fs.writeFile(VIEWS_FILE, JSON.stringify(views, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to save local views:", e);
  }
}

const View = async ({ id }: { id: string }) => {
  let totalViews = 0;
  try {
    const result = await client.withConfig({ useCdn: false }).fetch(
      STARTUP_VIEWS_QUERY,
      { id },
    );
    totalViews = result?.views ?? 0;
  } catch (err) {
    console.warn("Sanity fetch failed for views; using local fallback:", err);
  }

  if (!totalViews) {
    const localViews = await getLocalViews();
    totalViews = localViews[id] || 0;
  }

  totalViews += 1;

  // Try Sanity write first, fallback to local
  if (process.env.SANITY_WRITE_TOKEN) {
    writeClient
      .patch(id)
      .set({ views: totalViews })
      .commit()
      .catch(async (err) => {
        console.log("Error updating views in Sanity, using local:", err);
        const localViews = await getLocalViews();
        localViews[id] = totalViews;
        await saveLocalViews(localViews);
      });
  } else {
    const localViews = await getLocalViews();
    localViews[id] = totalViews;
    await saveLocalViews(localViews);
  }

  return (
    <div className="view-container">
      <div className="absolute -top-2 -right-2">
        <Ping />
      </div>

      <p className="view-text">
        <span className="font-black">Views: {totalViews}</span>
      </p>
    </div>
  );
};
export default View;

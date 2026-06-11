import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "dev-startups.json");
    let raw = "[]";
    try {
      raw = await fs.readFile(dataPath, "utf8");
    } catch (e) {
      raw = "[]";
    }
    const list = JSON.parse(raw || "[]");
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // prevent caching so dev updates are visible immediately
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "failed to read dev-startups" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

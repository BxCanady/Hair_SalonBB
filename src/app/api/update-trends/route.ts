import { updateTrendingStyles } from "@/lib/trendingStyles";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await updateTrendingStyles();
    console.info("Weekly hairstyle trends updated.", result);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly trend update failed";
    console.error("Weekly hairstyle trend update failed.", message);
    return Response.json({ error: message }, { status: 503 });
  }
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export async function onRequest({ request, env, params }) {
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

  try {
    const slug = params.slug;
    const row = await env.DB.prepare(
      "SELECT cover_key FROM posts WHERE slug=? AND is_published=1"
    ).bind(slug).first();

    if (!row?.cover_key) return json({ error: "No cover" }, 404);

    const obj = await env.BUCKET.get(row.cover_key);
    if (!obj) return json({ error: "Missing cover" }, 404);

    const ct = obj?.httpMetadata?.contentType || "image/jpeg";
    return new Response(obj.body, { headers: { "Content-Type": ct } });
  } catch (e) {
    return json({ error: "Server error", detail: String(e) }, 500);
  }
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export async function onRequest({ request, env, params }) {
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

  try {
    const slug = params.slug;
    const row = await env.DB.prepare(
      "SELECT pdf_key FROM posts WHERE slug=? AND is_published=1"
    ).bind(slug).first();

    if (!row?.pdf_key) return json({ error: "Not found" }, 404);

    const obj = await env.BUCKET.get(row.pdf_key);
    if (!obj) return json({ error: "File missing" }, 404);

    return new Response(obj.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes"
      }
    });
  } catch (e) {
    return json({ error: "Server error", detail: String(e) }, 500);
  }
}

// GET /api/posts/:slug/cover → stream the cover image (if any)
export async function onRequest({ env, params }) {
  try {
    const slug = params.slug;
    const row = await env.DB.prepare(
      "SELECT cover_key FROM posts WHERE slug=? AND is_published=1"
    ).bind(slug).first();

    if (!row?.cover_key) {
      return new Response(JSON.stringify({ error: "No cover" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const obj = await env.BUCKET.get(row.cover_key);
    if (!obj) {
      return new Response(JSON.stringify({ error: "Missing cover" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Note: if you store png as well, you could use obj.httpMetadata.contentType
    return new Response(obj.body, { headers: { "Content-Type": "image/jpeg" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

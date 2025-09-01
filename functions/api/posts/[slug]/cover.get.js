// GET /api/posts/:slug/cover
export async function onRequest({ env, params }) {
  const slug = params.slug;
  const row = await env.DB.prepare(
    "SELECT cover_key FROM posts WHERE slug=? AND is_published=1"
  ).bind(slug).first();

  if (!row?.cover_key) {
    return new Response(JSON.stringify({ error: "No cover" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  const obj = await env.BUCKET.get(row.cover_key);
  if (!obj) {
    return new Response(JSON.stringify({ error: "Missing cover" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  // If you stored different image types, you could HEAD the object and forward content-type.
  return new Response(obj.body, { headers: { "Content-Type": "image/jpeg" } });
}

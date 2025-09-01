// GET /api/posts/:slug/pdf
export async function onRequest({ env, params }) {
  const slug = params.slug;
  const row = await env.DB.prepare(
    "SELECT pdf_key FROM posts WHERE slug=? AND is_published=1"
  ).bind(slug).first();

  if (!row?.pdf_key) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  const obj = await env.BUCKET.get(row.pdf_key);
  if (!obj) {
    return new Response(JSON.stringify({ error: "File missing" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=3600",
      "Accept-Ranges": "bytes"
    }
  });
}

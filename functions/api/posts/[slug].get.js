// GET /api/posts/:slug
export async function onRequest({ env, params }) {
  const slug = params.slug;
  const row = await env.DB.prepare(
    `SELECT slug, title, summary, pdf_key, cover_key, published_at
     FROM posts WHERE slug=? AND is_published=1`
  ).bind(slug).first();

  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(row), {
    headers: { "Content-Type": "application/json" }
  });
}

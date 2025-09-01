// GET /api/posts
export async function onRequest({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT slug, title, summary, cover_key, published_at
     FROM posts WHERE is_published=1
     ORDER BY published_at DESC`
  ).all();

  return new Response(JSON.stringify(results || []), {
    headers: { "Content-Type": "application/json" }
  });
}
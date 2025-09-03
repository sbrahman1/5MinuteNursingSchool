// GET /api/posts → list all published posts
export async function onRequest({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, summary, cover_key, published_at
       FROM posts WHERE is_published=1
       ORDER BY published_at DESC`
    ).all();

    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

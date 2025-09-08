// List all published posts
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, summary, cover_key, published_at
       FROM posts WHERE is_published=1
       ORDER BY published_at DESC`
    ).all();
    return json(results || []);
  } catch (e) {
    return json({ error: "Server error", detail: String(e) }, 500);
  }
}

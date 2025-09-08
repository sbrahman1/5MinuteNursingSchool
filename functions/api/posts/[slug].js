const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export async function onRequest({ request, env, params }) {
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

  try {
    const slug = params.slug;
    const row = await env.DB.prepare(
      `SELECT slug, title, summary, pdf_key, cover_key, published_at
       FROM posts WHERE slug=? AND is_published=1`
    ).bind(slug).first();

    if (!row) return json({ error: "Not found" }, 404);
    return json(row);
  } catch (e) {
    return json({ error: "Server error", detail: String(e) }, 500);
  }
}

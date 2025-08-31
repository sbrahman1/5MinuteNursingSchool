// functions/api/posts.js
// Handles:
//   GET /api/posts
//   GET /api/posts/:slug
//   GET /api/posts/:slug/pdf
//   GET /api/posts/:slug/cover

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  // /api/posts[/...]
  const parts = url.pathname.split("/").filter(Boolean);
  // parts: ["api","posts", ...]
  const sub = parts.slice(2); // [...], starting after "api","posts"

  // GET /api/posts  → list
  if (request.method === "GET" && sub.length === 0) {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, summary, cover_key, published_at
       FROM posts WHERE is_published=1
       ORDER BY published_at DESC`
    ).all();
    return json(results || []);
  }

  // everything below requires a slug
  const slug = sub[0];
  if (!slug) return json({ error: "Not found" }, 404);

  // GET /api/posts/:slug/pdf  → stream PDF
  if (request.method === "GET" && sub[1] === "pdf") {
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
        "Accept-Ranges": "bytes",
      },
    });
  }

  // GET /api/posts/:slug/cover  → stream image (optional)
  if (request.method === "GET" && sub[1] === "cover") {
    const row = await env.DB.prepare(
      "SELECT cover_key FROM posts WHERE slug=? AND is_published=1"
    ).bind(slug).first();
    if (!row?.cover_key) return json({ error: "No cover" }, 404);

    const obj = await env.BUCKET.get(row.cover_key);
    if (!obj) return json({ error: "Missing cover" }, 404);

    // best-effort type (your covers are jpg/png usually)
    return new Response(obj.body, { headers: { "Content-Type": "image/jpeg" } });
  }

  // GET /api/posts/:slug  → metadata
  if (request.method === "GET" && sub.length === 1) {
    const row = await env.DB.prepare(
      `SELECT slug, title, summary, pdf_key, cover_key, published_at
       FROM posts WHERE slug=? AND is_published=1`
    ).bind(slug).first();
    if (!row) return json({ error: "Not found" }, 404);
    return json(row);
  }

  return json({ error: "Method Not Allowed" }, 405, { Allow: "GET" });
}

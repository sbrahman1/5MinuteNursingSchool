// /api/admin/posts  (GET = list, POST = create)
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

const ok = (req, env) => req.headers.get("x-admin-token") === env.ADMIN_TOKEN;

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function onRequest({ request, env }) {
  if (!ok(request, env)) return json({ error: "Unauthorized" }, 401);

  // List (GET)
  if (request.method === "GET") {
    try {
      const { results } = await env.DB.prepare(
        `SELECT slug, title, summary, cover_key, pdf_key, is_published, published_at
         FROM posts ORDER BY published_at DESC`
      ).all();
      return json(results || []);
    } catch (e) {
      return json({ error: "Server error", detail: String(e) }, 500);
    }
  }

  // Create (POST)
  if (request.method === "POST") {
    try {
      const form = await request.formData();
      const title = String(form.get("title") || "").trim();
      const summary = String(form.get("summary") || "").trim();
      const inputSlug = String(form.get("slug") || "").trim();

      if (!title || !summary) return json({ error: "Missing title/summary" }, 400);

      let slug = slugify(inputSlug || title) || String(Date.now());

      // PDF required (<=100MB)
      const pdf = form.get("pdf");
      if (!(pdf && pdf.name)) return json({ error: "PDF required" }, 400);
      if (pdf.size > 100 * 1024 * 1024) return json({ error: "PDF too large (max 100MB)" }, 400);

      const pdfKey = `pdf/${Date.now()}-${slug}.pdf`;
      await env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
        httpMetadata: { contentType: "application/pdf" },
      });

      // Cover optional (<=10MB)
      let coverKey = null;
      const cover = form.get("cover");
      if (cover && cover.name) {
        if (cover.size > 10 * 1024 * 1024) return json({ error: "Cover too large (max 10MB)" }, 400);
        const ext = (cover.type?.split("/")[1]) || "jpg";
        coverKey = `cover/${Date.now()}-${slug}.${ext}`;
        await env.BUCKET.put(coverKey, await cover.arrayBuffer(), {
          httpMetadata: { contentType: cover.type || "image/jpeg" },
        });
      }

      // Insert row (published=1)
      await env.DB.prepare(
        `INSERT INTO posts (slug, title, summary, cover_key, pdf_key, is_published)
         VALUES (?, ?, ?, ?, ?, 1)`
      )
        .bind(slug, title, summary, coverKey, pdfKey)
        .run();

      return json({ ok: true, slug, message: "Created" });
    } catch (e) {
      const msg = String(e || "");
      // Unique slug constraint?
      if (/UNIQUE|constraint/i.test(msg)) return json({ error: "Slug already exists" }, 409);
      return json({ error: "Server error", detail: msg }, 500);
    }
  }

  return json({ error: "Method Not Allowed" }, 405);
}

// /api/admin/posts/:slug  (GET = read one, PUT = update, DELETE = delete)
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

const ok = (req, env) => req.headers.get("x-admin-token") === env.ADMIN_TOKEN;

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function onRequest({ request, env, params }) {
  if (!ok(request, env)) return json({ error: "Unauthorized" }, 401);
  const currentSlug = params.slug;

  // Read one (GET) — includes keys so the admin knows what exists
  if (request.method === "GET") {
    const row = await env.DB.prepare(
      `SELECT slug, title, summary, cover_key, pdf_key, is_published, published_at
       FROM posts WHERE slug=?`
    ).bind(currentSlug).first();
    if (!row) return json({ error: "Not found" }, 404);
    return json(row);
  }

  // Update (PUT) — any field optional; files replace old ones
  if (request.method === "PUT") {
    const form = await request.formData();

    const row = await env.DB.prepare(
      `SELECT slug, title, summary, cover_key, pdf_key FROM posts WHERE slug=?`
    ).bind(currentSlug).first();
    if (!row) return json({ error: "Not found" }, 404);

    const title = String(form.get("title") ?? row.title).trim();
    const summary = String(form.get("summary") ?? row.summary).trim();
    const inputSlug = String(form.get("slug") || row.slug).trim();
    const newSlug = slugify(inputSlug) || row.slug;

    // Conflict if newSlug taken by a different row
    if (newSlug !== currentSlug) {
      const exists = await env.DB.prepare(
        "SELECT 1 FROM posts WHERE slug=?"
      ).bind(newSlug).first();
      if (exists) return json({ error: "Slug already exists" }, 409);
    }

    let pdfKey = row.pdf_key;
    const pdf = form.get("pdf");
    if (pdf && pdf.name) {
      if (pdf.size > 100 * 1024 * 1024) return json({ error: "PDF too large (max 100MB)" }, 400);
      const newPdfKey = `pdf/${Date.now()}-${newSlug}.pdf`;
      await env.BUCKET.put(newPdfKey, await pdf.arrayBuffer(), {
        httpMetadata: { contentType: "application/pdf" },
      });
      pdfKey = newPdfKey;
    }

    let coverKey = row.cover_key;
    const cover = form.get("cover");
    if (cover && cover.name) {
      if (cover.size > 10 * 1024 * 1024) return json({ error: "Cover too large (max 10MB)" }, 400);
      const ext = (cover.type?.split("/")[1]) || "jpg";
      const newCoverKey = `cover/${Date.now()}-${newSlug}.${ext}`;
      await env.BUCKET.put(newCoverKey, await cover.arrayBuffer(), {
        httpMetadata: { contentType: cover.type || "image/jpeg" },
      });
      coverKey = newCoverKey;
    }

    // Update row
    await env.DB.prepare(
      `UPDATE posts
         SET slug=?, title=?, summary=?, cover_key=?, pdf_key=?
       WHERE slug=?`
    )
      .bind(newSlug, title, summary, coverKey, pdfKey, currentSlug)
      .run();

    // Clean up old files if we replaced them
    try {
      if (pdf && pdf.name && row.pdf_key && row.pdf_key !== pdfKey) await env.BUCKET.delete(row.pdf_key);
      if (cover && cover.name && row.cover_key && row.cover_key !== coverKey) await env.BUCKET.delete(row.cover_key);
    } catch (_) {}

    return json({ ok: true, slug: newSlug, message: "Updated" });
  }

  // Delete (DELETE) — remove DB row and files
  if (request.method === "DELETE") {
    const row = await env.DB.prepare(
      "SELECT pdf_key, cover_key FROM posts WHERE slug=?"
    ).bind(currentSlug).first();
    if (!row) return json({ error: "Not found" }, 404);

    await env.DB.prepare("DELETE FROM posts WHERE slug=?").bind(currentSlug).run();

    try { if (row.pdf_key) await env.BUCKET.delete(row.pdf_key); } catch (_) {}
    try { if (row.cover_key) await env.BUCKET.delete(row.cover_key); } catch (_) {}

    return json({ ok: true, message: "Deleted", slug: currentSlug });
  }

  return json({ error: "Method Not Allowed" }, 405);
}

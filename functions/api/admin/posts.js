// functions/api/admin/posts.js
// Handles: POST /api/admin/posts

const json = (obj, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });

export async function onRequest({ request, env }) {
  // ✅ Only allow POST
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405, { Allow: "POST" });
  }

  try {
    // ---- Auth
    const token = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN) return json({ error: "Server missing ADMIN_TOKEN" }, 500);
    if (token !== env.ADMIN_TOKEN) return json({ error: "Unauthorized" }, 401);

    // ---- Parse form data
    const form = await request.formData();
    const title = String(form.get("title") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const inputSlug = String(form.get("slug") || "").trim();
    if (!title || !summary) return json({ error: "Missing title/summary" }, 400);

    const slugify = (s) =>
      (s || "")
        .toLowerCase()
        .trim()
        .replace(/[^\w]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const slug = slugify(inputSlug || title) || String(Date.now());

    // ---- Validate bindings
    if (!env.DB) return json({ error: "D1 binding DB not configured" }, 500);
    if (!env.BUCKET) return json({ error: "R2 binding BUCKET not configured" }, 500);

    // ---- Ensure schema exists (safety net)
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        cover_key TEXT,
        pdf_key TEXT NOT NULL,
        published_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at   TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
        is_published INTEGER NOT NULL DEFAULT 1
      );
    `).run();

    // ---- PDF (required, <= 100MB)
    const pdf = form.get("pdf");
    if (!(pdf && pdf.name)) return json({ error: "PDF required" }, 400);
    if (pdf.size > 100 * 1024 * 1024)
      return json({ error: "PDF too large (max 100 MB)" }, 400);

    const pdfKey = `pdf/${Date.now()}-${slug}.pdf`;
    await env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
      httpMetadata: { contentType: "application/pdf" },
    });

    // ---- Cover optional (<= 10MB)
    let coverKey = null;
    const cover = form.get("cover");
    if (cover && cover.name) {
      if (cover.size > 10 * 1024 * 1024)
        return json({ error: "Cover too large (max 10 MB)" }, 400);
      const ext = (cover.type?.split("/")[1]) || "jpg";
      coverKey = `cover/${Date.now()}-${slug}.${ext}`;
      await env.BUCKET.put(coverKey, await cover.arrayBuffer(), {
        httpMetadata: { contentType: cover.type || "image/jpeg" },
      });
    }

    // ---- Insert into DB
    await env.DB.prepare(
      `INSERT INTO posts (slug, title, summary, cover_key, pdf_key, is_published)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(slug, title, summary, coverKey, pdfKey)
      .run();

    return json({
      ok: true,
      slug,
      message: "Upload complete",
      sizeMB: (pdf.size / (1024 * 1024)).toFixed(2),
    });
  } catch (err) {
    console.error("admin/posts error:", err);
    return json({ error: "Server error", detail: String(err) }, 500);
  }
}

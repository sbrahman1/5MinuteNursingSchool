// functions/api/admin/posts.js
// Route: /api/admin/posts

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });

export async function onRequest(ctx) {
  const { request, env } = ctx;

  // Only allow POST
  if (request.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405, {
      Allow: "POST",
    });
  }

  try {
    // Auth
    const token = request.headers.get("x-admin-token");
    if (token !== env.ADMIN_TOKEN) return json({ error: "Unauthorized" }, 401);

    // Form data
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

    // PDF (required, <= 100MB)
    const pdf = form.get("pdf");
    if (!(pdf && pdf.name)) return json({ error: "PDF required" }, 400);
    if (pdf.size > 100 * 1024 * 1024)
      return json({ error: "PDF too large (max 100 MB)" }, 400);

    const pdfKey = `pdf/${Date.now()}-${slug}.pdf`;
    await env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
      httpMetadata: { contentType: "application/pdf" },
    });

    // Cover (optional, <= 10MB)
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

    // Insert metadata row
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
    return json({ error: "Server error", detail: String(err) }, 500);
  }
}

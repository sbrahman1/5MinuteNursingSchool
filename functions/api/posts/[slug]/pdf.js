// GET /api/posts/:slug/pdf  → streams the PDF with HTTP Range support
const j = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequest({ request, env, params }) {
  if (request.method !== "GET") return j({ error: "Method Not Allowed" }, 405);

  try {
    const slug = params.slug;

    // find the key in D1
    const row = await env.DB
      .prepare("SELECT pdf_key FROM posts WHERE slug=? AND is_published=1")
      .bind(slug)
      .first();

    if (!row?.pdf_key) return j({ error: "Not found" }, 404);

    // Many browsers request partial ranges for PDFs.
    const range = request.headers.get("Range");
    const baseHeaders = {
      "Content-Type": "application/pdf",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      // show inline in viewer with a nice filename
      "Content-Disposition": `inline; filename="${slug}.pdf"`,
    };

    // Get object size first
    const head = await env.BUCKET.head(row.pdf_key);
    if (!head) return j({ error: "File missing" }, 404);
    const size = head.size;

    // If client asked for a Range, serve 206 Partial Content
    if (range && /^bytes=\d+-\d*$/.test(range)) {
      const [, startStr, endStr] = range.match(/^bytes=(\d+)-(\d*)$/);
      const start = Number(startStr);
      const end = endStr ? Number(endStr) : size - 1;
      if (isNaN(start) || start >= size || end < start) {
        // invalid range
        return new Response(null, {
          status: 416,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes */${size}`,
          },
        });
      }
      const length = end - start + 1;

      const part = await env.BUCKET.get(row.pdf_key, {
        range: { offset: start, length },
      });
      if (!part) return j({ error: "File missing" }, 404);

      return new Response(part.body, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Content-Length": String(length),
        },
      });
    }

    // No Range → send the full object
    const full = await env.BUCKET.get(row.pdf_key);
    if (!full) return j({ error: "File missing" }, 404);

    // Full length helps some viewers
    return new Response(full.body, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(size),
      },
    });
  } catch (e) {
    console.error("pdf route error:", e);
    return j({ error: "Server error", detail: String(e) }, 500);
  }
}

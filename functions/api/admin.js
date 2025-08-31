import { Hono } from 'hono'

const admin = new Hono()

// ✅ Check auth header
const ok = (c) => c.req.header('x-admin-token') === c.env.ADMIN_TOKEN

// ✅ Slugify titles for clean URLs
const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w]+/g, '-')
    .replace(/(^-|-$)/g, '')

admin.post('/posts', async c => {
  if (!ok(c)) return c.json({ error: 'Unauthorized' }, 401)

  const form = await c.req.formData()

  const title = String(form.get('title') || '')
  const summary = String(form.get('summary') || '')
  let slug = slugify(String(form.get('slug') || title)) || String(Date.now())

  // ✅ PDF required
  const pdf = form.get('pdf')
  if (!(pdf && pdf.name)) return c.json({ error: 'PDF required' }, 400)

  // ✅ File size limit check (100 MB)
  if (pdf.size > 100 * 1024 * 1024) {
    return c.json({ error: 'PDF too large (max 100 MB)' }, 400)
  }

  const pdfKey = `pdf/${Date.now()}-${slug}.pdf`
  await c.env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
    httpMetadata: { contentType: 'application/pdf' }
  })

  // ✅ Optional cover image
  let coverKey = null
  const cover = form.get('cover')
  if (cover && cover.name) {
    if (cover.size > 10 * 1024 * 1024) { // limit cover images too
      return c.json({ error: 'Cover too large (max 10 MB)' }, 400)
    }
    const ext = (cover.type?.split('/')[1]) || 'jpg'
    coverKey = `cover/${Date.now()}-${slug}.${ext}`
    await c.env.BUCKET.put(coverKey, await cover.arrayBuffer(), {
      httpMetadata: { contentType: cover.type || 'image/jpeg' }
    })
  }

  // ✅ Insert metadata into D1
  await c.env.DB.prepare(
    `INSERT INTO posts (slug, title, summary, cover_key, pdf_key, is_published)
     VALUES (?, ?, ?, ?, ?, 1)`
  ).bind(slug, title, summary, coverKey, pdfKey).run()

  return c.json({
    ok: true,
    slug,
    message: 'Upload complete',
    sizeMB: (pdf.size / (1024 * 1024)).toFixed(2)
  })
})

export default admin

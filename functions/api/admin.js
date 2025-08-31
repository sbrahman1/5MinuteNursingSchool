import { Hono } from 'hono'

const app = new Hono()

const ok = (c) => c.req.header('x-admin-token') === c.env.ADMIN_TOKEN
const slugify = (s) =>
  (s || '').toLowerCase().trim().replace(/[^\w]+/g,'-').replace(/(^-|-$)/g,'')

app.post('/posts', async c => {
  try {
    if (!ok(c)) return c.json({ error: 'Unauthorized' }, 401)

    const form = await c.req.formData()
    const title = String(form.get('title') || '')
    const summary = String(form.get('summary') || '')
    let slug = slugify(String(form.get('slug') || title)) || String(Date.now())

    const pdf = form.get('pdf')
    if (!(pdf && pdf.name)) return c.json({ error: 'PDF required' }, 400)
    if (pdf.size > 100 * 1024 * 1024) {
      return c.json({ error: 'PDF too large (max 100 MB)' }, 400)
    }

    const pdfKey = `pdf/${Date.now()}-${slug}.pdf`
    await c.env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
      httpMetadata: { contentType: 'application/pdf' }
    })

    let coverKey = null
    const cover = form.get('cover')
    if (cover && cover.name) {
      if (cover.size > 10 * 1024 * 1024) {
        return c.json({ error: 'Cover too large (max 10 MB)' }, 400)
      }
      const ext = (cover.type?.split('/')[1]) || 'jpg'
      coverKey = `cover/${Date.now()}-${slug}.${ext}`
      await c.env.BUCKET.put(coverKey, await cover.arrayBuffer(), {
        httpMetadata: { contentType: cover.type || 'image/jpeg' }
      })
    }

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
  } catch (err) {
    return c.json({ error: 'Server error', detail: String(err) }, 500)
  }
})

// IMPORTANT for Pages Functions:
export const onRequest = app.fetch

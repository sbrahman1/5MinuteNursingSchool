import { Hono } from 'hono'

const admin = new Hono()

const ok = (c) => c.req.header('x-admin-token') === c.env.ADMIN_TOKEN

const slugify = (s) =>
  (s||'').toLowerCase().trim().replace(/[^\w]+/g,'-').replace(/(^-|-$)/g,'')

admin.post('/posts', async c => {
  if (!ok(c)) return c.json({ error: 'Unauthorized' }, 401)
  const form = await c.req.formData()

  const title = String(form.get('title') || '')
  const summary = String(form.get('summary') || '')
  let slug = slugify(String(form.get('slug') || title)) || String(Date.now())

  const pdf = form.get('pdf')
  if (!(pdf && pdf.name)) return c.json({ error: 'PDF required' }, 400)

  const pdfKey = `pdf/${Date.now()}-${slug}.pdf`
  await c.env.BUCKET.put(pdfKey, await pdf.arrayBuffer(), {
    httpMetadata: { contentType: 'application/pdf' }
  })

  let coverKey = null
  const cover = form.get('cover')
  if (cover && cover.name) {
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

  return c.json({ ok: true, slug })
})

export default admin

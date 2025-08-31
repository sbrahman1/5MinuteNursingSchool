import { Hono } from 'hono'

const posts = new Hono()

// List posts
posts.get('/', async c => {
  const { results } = await c.env.DB.prepare(
    `SELECT slug, title, summary, cover_key, published_at
     FROM posts WHERE is_published=1
     ORDER BY published_at DESC`
  ).all()
  return c.json(results || [])
})

// Get one post
posts.get('/:slug', async c => {
  const slug = c.req.param('slug')
  const row = await c.env.DB
    .prepare(`SELECT slug, title, summary, pdf_key, cover_key, published_at
             FROM posts WHERE slug=? AND is_published=1`)
    .bind(slug).first()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

// Stream PDF
posts.get('/:slug/pdf', async c => {
  const slug = c.req.param('slug')
  const row = await c.env.DB
    .prepare('SELECT pdf_key FROM posts WHERE slug=? AND is_published=1')
    .bind(slug).first()
  if (!row) return c.json({ error: 'Not found' }, 404)
  const obj = await c.env.BUCKET.get(row.pdf_key)
  if (!obj) return c.json({ error: 'File missing' }, 404)
  return new Response(obj.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes'
    }
  })
})

// Cover image (optional)
posts.get('/:slug/cover', async c => {
  const slug = c.req.param('slug')
  const row = await c.env.DB
    .prepare('SELECT cover_key FROM posts WHERE slug=? AND is_published=1')
    .bind(slug).first()
  if (!row?.cover_key) return c.json({ error: 'No cover' }, 404)
  const obj = await c.env.BUCKET.get(row.cover_key)
  if (!obj) return c.json({ error: 'Missing cover' }, 404)
  return new Response(obj.body, { headers: { 'Content-Type': 'image/jpeg' } })
})

export default posts

import { Hono } from 'hono'
import posts from './posts.js'
import admin from './admin.js'

const app = new Hono()

app.route('/posts', posts)
app.route('/admin', admin)

export const onRequest = app.fetch

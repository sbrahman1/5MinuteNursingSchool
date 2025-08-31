import { useState } from "react"
import "./admin.css"

export default function Admin() {
  const [token, setToken] = useState("")
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [slug, setSlug] = useState("")
  const [cover, setCover] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [msg, setMsg] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    if (slug) fd.set("slug", slug)
    fd.set("title", title)
    fd.set("summary", summary)
    if (cover) fd.set("cover", cover)
    if (pdf) fd.set("pdf", pdf)

    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "x-admin-token": token },
      body: fd
    })
    const data = await res.json()
    setMsg(res.ok ? `Published: /home/${data.slug}` : (data.error || "Failed"))
  }

  return (
    <div className="admin-wrap">
      <h1>Admin — Create Note</h1>
      <form onSubmit={submit} className="form">
        <input placeholder="Admin token" value={token} onChange={e=>setToken(e.target.value)} />
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
        <input placeholder="Custom slug (optional)" value={slug} onChange={e=>setSlug(e.target.value)} />
        <textarea placeholder="Summary (shown on list)" rows={6} value={summary} onChange={e=>setSummary(e.target.value)} required />
        <div className="row">
          <div><label>Cover image</label><input type="file" accept="image/*" onChange={e=>setCover(e.target.files?.[0]||null)} /></div>
          <div><label>PDF (required)</label><input type="file" accept="application/pdf" required onChange={e=>setPdf(e.target.files?.[0]||null)} /></div>
        </div>
        <button>Publish</button>
      </form>
      {msg && <p className="msg">{msg}</p>}
    </div>
  )
}

import React, { useState } from "react";

export default function Admin() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (slug) fd.set("slug", slug);
    fd.set("title", title);
    fd.set("summary", summary);
    if (cover) fd.set("cover", cover);
    if (pdf) fd.set("pdf", pdf);

    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "x-admin-token": token },
      body: fd,
    });
    const data = await res.json();
    setMsg(res.ok ? `Published: /home/${data.slug}` : (data.error || "Failed"));
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Create Note</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Admin token" value={token} onChange={(e)=>setToken(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        <input className="w-full border p-2 rounded" placeholder="Custom slug (optional)" value={slug} onChange={(e)=>setSlug(e.target.value)} />
        <textarea className="w-full border p-2 rounded" placeholder="Summary (shown on list)" rows={5} value={summary} onChange={(e)=>setSummary(e.target.value)} required />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm">Cover image</label>
            <input type="file" accept="image/*" onChange={(e)=>setCover(e.target.files?.[0]||null)} />
          </div>
          <div className="flex-1">
            <label className="text-sm">PDF (required)</label>
            <input type="file" accept="application/pdf" required onChange={(e)=>setPdf(e.target.files?.[0]||null)} />
          </div>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded">Publish</button>
      </form>
      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}

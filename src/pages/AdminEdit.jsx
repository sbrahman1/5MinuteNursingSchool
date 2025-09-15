import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function Labeled({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

export default function AdminEdit() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [slugField, setSlugField] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("Loading…");

  const headers = token ? { "x-admin-token": token } : {};

  useEffect(() => {
    setMsg("Loading…");
    fetch(`/api/admin/posts/${slug}`, { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json())?.error || r.statusText);
        return r.json();
      })
      .then((p) => {
        setTitle(p.title || "");
        setSlugField(p.slug || "");
        setSummary(p.summary || "");
        setMsg("");
      })
      .catch((e) => setMsg(`❌ ${e.message}`));
    // eslint-disable-next-line
  }, [slug, token]);

  const onSave = async (e) => {
    e.preventDefault();
    setMsg("Saving…");
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("summary", summary);
      if (slugField) fd.append("slug", slugField);
      if (cover) fd.append("cover", cover);
      if (pdf) fd.append("pdf", pdf);

      const r = await fetch(`/api/admin/posts/${slug}`, { method: "PUT", headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Update failed");

      setMsg("✅ Saved");
      // If slug changed, navigate to new editor path
      if (data.slug && data.slug !== slug) {
        nav(`/admin/edit/${data.slug}`, { replace: true });
      }
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Delete this post and its files?")) return;
    setMsg("Deleting…");
    try {
      const r = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE", headers });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Delete failed");
      nav("/admin");
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit note</h1>
        <Link to="/admin" className="text-blue-600 hover:underline">← Back to admin</Link>
      </div>

      <div>
        <Labeled>Admin token</Labeled>
        <input
          type="password"
          placeholder="Enter admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <form onSubmit={onSave} className="space-y-4 p-4 border rounded-xl bg-white">
        <div>
          <Labeled>Title</Labeled>
          <input className="w-full border rounded-lg p-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>

        <div>
          <Labeled>Slug</Labeled>
          <input className="w-full border rounded-lg p-2" value={slugField} onChange={(e)=>setSlugField(e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Changing the slug changes the URL.</p>
        </div>

        <div>
          <Labeled>Summary</Labeled>
          <textarea className="w-full border rounded-lg p-2" rows={5} value={summary} onChange={(e)=>setSummary(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Labeled>Replace cover (optional)</Labeled>
            <input type="file" accept="image/*" onChange={(e)=>setCover(e.target.files?.[0]||null)} />
          </div>
          <div>
            <Labeled>Replace PDF (optional)</Labeled>
            <input type="file" accept="application/pdf" onChange={(e)=>setPdf(e.target.files?.[0]||null)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save changes</button>
          <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
          <a className="px-4 py-2 bg-gray-100 rounded-lg" href={`/home/${slugField||slug}`} target="_blank" rel="noreferrer">View</a>
        </div>

        {msg && <div className="text-sm mt-2">{msg}</div>}
      </form>
    </div>
  );
}

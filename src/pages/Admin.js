import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Labeled({ children }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

export default function Admin() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("");
  const [posts, setPosts] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const headers = token ? { "x-admin-token": token } : {};

  const fetchPosts = async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const r = await fetch("/api/admin/posts", { headers });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || r.statusText);
      setPosts(data);
    } catch (e) {
      console.error(e);
      setMsg(`List error: ${e.message}`);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchPosts(); /* eslint-disable-next-line */ }, [token]);

  const onCreate = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      if (!pdf) throw new Error("PDF is required");

      const fd = new FormData();
      fd.append("title", title);
      fd.append("summary", summary);
      if (slug) fd.append("slug", slug);
      if (cover) fd.append("cover", cover);
      fd.append("pdf", pdf);

      const r = await fetch("/api/admin/posts", { method: "POST", headers, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Publish failed");
      setMsg(`✅ Created: /home/${data.slug}`);
      setTitle(""); setSlug(""); setSummary(""); setCover(null); setPdf(null);
      await fetchPosts();
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const onDelete = async (slug) => {
    if (!window.confirm(`Delete "${slug}"? This removes the DB row and files.`)) return;
    try {
      const r = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE", headers });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Delete failed");
      setMsg(`🗑️ Deleted: ${slug}`);
      setPosts((arr) => arr.filter((p) => p.slug !== slug));
    } catch (e) {
      setMsg(`❌ ${e.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin — Create / Manage Notes</h1>

      {/* Token */}
      <div>
        <Labeled>Admin token</Labeled>
        <input
          type="password"
          placeholder="Enter admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <p className="text-xs text-gray-500 mt-1">This is never saved; kept only in memory.</p>
      </div>

      {/* Create */}
      <form onSubmit={onCreate} className="space-y-4 p-4 border rounded-xl bg-white">
        <h2 className="text-xl font-semibold">Create a note</h2>

        <div>
          <Labeled>Title</Labeled>
          <input className="w-full border rounded-lg p-2" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>

        <div>
          <Labeled>Custom slug (optional)</Labeled>
          <input className="w-full border rounded-lg p-2" value={slug} onChange={(e)=>setSlug(e.target.value)} />
        </div>

        <div>
          <Labeled>Summary</Labeled>
          <textarea className="w-full border rounded-lg p-2" rows={5} value={summary} onChange={(e)=>setSummary(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Labeled>Cover image (optional)</Labeled>
            <input type="file" accept="image/*" onChange={(e)=>setCover(e.target.files?.[0]||null)} />
          </div>
          <div>
            <Labeled>PDF (required)</Labeled>
            <input type="file" accept="application/pdf" onChange={(e)=>setPdf(e.target.files?.[0]||null)} />
          </div>
        </div>

        <button className="px-4 py-2 bg-green-600 text-white rounded-lg">Publish</button>
        {msg && <div className="mt-2 text-sm">{msg}</div>}
      </form>

      {/* List / manage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">All posts</h2>
          <button onClick={fetchPosts} className="px-3 py-1.5 bg-gray-100 border rounded-lg">Refresh</button>
        </div>

        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Published</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td className="p-3" colSpan={4}>Loading…</td></tr>
              ) : posts.length === 0 ? (
                <tr><td className="p-3" colSpan={4}>No posts yet.</td></tr>
              ) : posts.map((p) => (
                <tr key={p.slug} className="border-t">
                  <td className="p-2">{p.title}</td>
                  <td className="p-2 font-mono">{p.slug}</td>
                  <td className="p-2">{p.is_published ? "Yes" : "No"}</td>
                  <td className="p-2 space-x-2">
                    <Link to={`/admin/edit/${p.slug}`} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</Link>
                    <button onClick={() => onDelete(p.slug)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    <a href={`/home/${p.slug}`} target="_blank" rel="noreferrer" className="px-2 py-1 bg-gray-200 rounded">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

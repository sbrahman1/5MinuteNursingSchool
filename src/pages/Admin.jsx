import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  // remember token for this browser session
  const [token, setToken] = useState(
    () => sessionStorage.getItem("ADMIN_TOKEN") || ""
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // list state
  const [posts, setPosts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listErr, setListErr] = useState("");

  // keep token in session storage
  useEffect(() => {
    sessionStorage.setItem("ADMIN_TOKEN", token || "");
  }, [token]);

  // load list whenever token becomes available
  useEffect(() => {
    if (token) loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadPosts() {
    if (!token) return;
    setListLoading(true);
    setListErr("");
    try {
      const res = await fetch("/api/admin/posts", {
        headers: { "x-admin-token": token },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${t || res.statusText}`);
      }
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      setListErr(`Failed to load posts: ${e.message}`);
    } finally {
      setListLoading(false);
    }
  }

  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function onPublish(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!token) {
      setErr("Enter admin token first.");
      return;
    }
    if (!pdf) {
      setErr("PDF is required.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title);
    fd.append("summary", summary);
    if (slug) fd.append("slug", slugify(slug));
    fd.append("pdf", pdf);
    if (cover) fd.append("cover", cover);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);

      const s = data.slug || slugify(slug || title);
      setMsg(`Uploaded. Opened /home/${s}`);
      // refresh list
      await loadPosts();
      // optional: jump to detail
      navigate(`/home/${s}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(slug) {
    if (!window.confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      await loadPosts();
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin — Create Note</h1>

      <form onSubmit={onPublish} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Custom slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <textarea
          rows={5}
          className="w-full border rounded px-3 py-2"
          placeholder="Summary (shown on list)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Cover image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0] || null)} />
          </div>
          <div>
            <label className="block text-sm mb-1">PDF (required)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0] || null)} />
          </div>
        </div>

        <button
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Publishing…" : "Publish"}
        </button>

        {msg && <p className="text-emerald-700">{msg}</p>}
        {err && <p className="text-red-600">Error: {err}</p>}
      </form>

      {/* ---- List & actions ---- */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold">All posts</h2>
          <button
            onClick={loadPosts}
            disabled={!token || listLoading}
            className="px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-60"
          >
            {listLoading ? "Loading…" : "Refresh"}
          </button>
          {!token && <span className="text-sm text-gray-500">enter token to load</span>}
        </div>

        {listErr && <p className="text-red-600 mb-2">{listErr}</p>}

        {token && posts.length === 0 && !listLoading && (
          <p className="text-gray-600">No posts yet.</p>
        )}

        {posts.length > 0 && (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Slug</th>
                  <th className="text-left px-3 py-2">Published</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.slug} className="border-t">
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2 font-mono">{p.slug}</td>
                    <td className="px-3 py-2">
                      {p.published_at ? new Date(p.published_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <Link
                        to={`/home/${p.slug}`}
                        className="px-2 py-1 rounded border hover:bg-gray-100"
                      >
                        View
                      </Link>
                      <Link
                        to={`/admin/edit/${p.slug}`}
                        className="px-2 py-1 rounded border hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => onDelete(p.slug)}
                        className="px-2 py-1 rounded border hover:bg-red-50 text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

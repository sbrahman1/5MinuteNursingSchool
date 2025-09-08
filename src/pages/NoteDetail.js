import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";

export default function NoteDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: "" });
    fetch(`/api/posts/${slug}`, { headers: { Accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(`GET /api/posts/${slug} → HTTP ${r.status} ${text.slice(0,120)}`);
        }
        return r.json();
      })
      .then((data) => {
        if (alive) {
          setPost(data);
          setState({ loading: false, error: "" });
        }
      })
      .catch((e) => {
        if (alive) setState({ loading: false, error: e.message || "Failed to load" });
      });
    return () => { alive = false; };
  }, [slug]);

  if (state.loading) return <div className="p-6">Loading…</div>;
  if (state.error) return (
    <div className="max-w-3xl mx-auto p-6 space-y-3">
      <Link to="/home" className="text-blue-600 hover:underline">← Back</Link>
      <div className="text-red-600">Error: {state.error}</div>
      <div className="text-sm text-gray-500">Tip: make sure you’re on the same host (www vs pages.dev) as where you uploaded.</div>
    </div>
  );
  if (!post) return <div className="p-6">Not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <Link to="/home" className="text-blue-600 hover:underline">← Back to notes</Link>
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="text-gray-700">{post.summary}</p>

      <div className="rounded-lg overflow-hidden border">
        <PdfViewer src={`/api/posts/${post.slug}/pdf`} />
      </div>
    </div>
  );
}

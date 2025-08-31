import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";

export default function NoteDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then((r) => r.json())
      .then(setPost)
      .catch(() => setPost(null));
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* PDF served via backend proxy */}
          <PdfViewer src={`/api/posts/${post.slug}/pdf`} />
        </div>
        <aside className="lg:col-span-1 bg-white/80 backdrop-blur border rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="text-sm text-gray-500 mt-2">
            {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
          </div>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{post.summary}</p>
        </aside>
      </div>
    </div>
  );
}

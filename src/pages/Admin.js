import React, { useState } from "react";

export default function Admin() {
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const submit = async (e) => {
    e.preventDefault();

    if (!pdf) {
      setMsg("❌ Please select a PDF file.");
      return;
    }

    // ✅ File size limit (100 MB)
    if (pdf.size > 100 * 1024 * 1024) {
      setMsg("❌ PDF is too large (max 100 MB).");
      return;
    }

    const fd = new FormData();
    if (slug) fd.set("slug", slug);
    fd.set("title", title);
    fd.set("summary", summary);
    if (cover) fd.set("cover", cover);
    fd.set("pdf", pdf);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/posts");
    xhr.setRequestHeader("x-admin-token", token);

    // ✅ Progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setMsg(`Uploading… ${percent}%`);
      }
    };

    // ✅ Success
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          setMsg(
            `✅ Upload complete (${data.sizeMB} MB). Published at /home/${data.slug}`
          );
        } else {
          setMsg(`❌ Failed: ${data.error || xhr.statusText}`);
        }
      } catch {
        setMsg(`❌ Failed: ${xhr.status} ${xhr.statusText}`);
      }
      setProgress(0);
    };

    // ✅ Error
    xhr.onerror = () => {
      setMsg("❌ Upload failed (network error).");
      setProgress(0);
    };

    xhr.send(fd);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Create Note</h1>

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Admin token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Custom slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Summary (shown on list)"
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm">Cover image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
            />
            {cover && (
              <p className="text-xs text-gray-500">
                {cover.name} — {(cover.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-sm">PDF (required)</label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setPdf(e.target.files?.[0] || null)}
            />
            {pdf && (
              <p className="text-xs text-gray-500">
                {pdf.name} — {(pdf.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded">
          Publish
        </button>
      </form>

      {/* ✅ Progress bar */}
      {progress > 0 && (
        <div className="w-full bg-gray-200 rounded mt-4">
          <div
            className="bg-emerald-600 text-white text-xs text-center rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {msg && <p className="mt-4">{msg}</p>}
    </div>
  );
}

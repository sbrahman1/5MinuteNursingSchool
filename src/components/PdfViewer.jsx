import React, { useEffect, useRef, useState } from "react";
// Import the ESM build of pdf.js
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";

// Create (and reuse) a module worker from our own domain
let sharedWorker;
function getPdfWorker() {
  if (!sharedWorker) {
    sharedWorker = new Worker("/pdf.worker.min.mjs", { type: "module" });
  }
  return sharedWorker;
}

/**
 * Canvas PDF viewer: no download/print UI, selection disabled, right-click blocked.
 * Allows going to a specific page. Fits to container width.
 */
export default function PdfViewer({ src, height = "80vh" }) {
  const shellRef = useRef(null);
  const canvasRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");

  // Block common save/print shortcuts
  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "o")) e.preventDefault();
  };

  // Point pdf.js at our module worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerPort = getPdfWorker();
  }, []);

  // Load the PDF
  useEffect(() => {
    let cancelled = false;
    setErr("");
    setDoc(null);
    setNumPages(0);
    setPage(1);

    const task = pdfjsLib.getDocument({
      url: src,
      rangeChunkSize: 65536,
      disableAutoFetch: false,
      disableStream: false,
    });

    task.promise
      .then((pdf) => {
        if (cancelled) return;
        setDoc(pdf);
        setNumPages(pdf.numPages);
      })
      .catch((e) => !cancelled && setErr(e?.message || String(e)));

    return () => {
      cancelled = true;
      try { task.destroy(); } catch {}
    };
  }, [src]);

  // Render current page into canvas, fit to container width
  useEffect(() => {
    if (!doc || !canvasRef.current || !shellRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        const containerWidth = shellRef.current.clientWidth || 800;
        const viewport1 = pdfPage.getViewport({ scale: 1 });
        const scale = containerWidth / viewport1.width;
        const viewport = pdfPage.getViewport({ scale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderTask = pdfPage.render({ canvasContext: ctx, viewport, intent: "display" });
        await renderTask.promise;
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      }
    })();

    const ro = new ResizeObserver(() => setPage((p) => p)); // trigger re-render
    ro.observe(shellRef.current);

    return () => {
      cancelled = true;
      try { ro.disconnect(); } catch {}
    };
  }, [doc, page]);

  if (err) return <div className="p-4 text-red-600">Failed to load PDF: {err}</div>;

  return (
    <div
      ref={shellRef}
      className="pdf-shell no-print select-none"
      style={{
        height,
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: "#fff",
        overflow: "auto",
        position: "relative",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Minimal pager */}
      <div
        className="absolute top-2 right-2 z-10"
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "6px 8px",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ padding: "2px 6px", borderRadius: 6, border: "1px solid #ddd", background: "#f9fafb" }}
        >
          ◀
        </button>
        <span>Page</span>
        <input
          type="number"
          min={1}
          max={numPages || 1}
          value={page}
          onChange={(e) => {
            const v = Math.min(Math.max(1, Number(e.target.value || 1)), numPages || 1);
            setPage(v);
          }}
          style={{ width: 60, border: "1px solid #ddd", borderRadius: 6, padding: "2px 6px" }}
          onContextMenu={(e) => e.preventDefault()}
        />
        <span>/ {numPages || "…"}</span>
        <button
          onClick={() => setPage((p) => Math.min(numPages || p, p + 1))}
          disabled={!numPages || page >= numPages}
          style={{ padding: "2px 6px", borderRadius: 6, border: "1px solid #ddd", background: "#f9fafb" }}
        >
          ▶
        </button>
      </div>

      <div className="flex items-start justify-center p-4" style={{ userSelect: "none" }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}

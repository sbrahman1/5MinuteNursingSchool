import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf"; // direct pdf.js (no react-pdf)

// Use the local worker you vendored in /public
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

/**
 * Canvas PDF viewer: no download/print UI, selection disabled, right-click blocked.
 * Allows jumping to a page. Fits width of the container.
 */
export default function PdfViewer({ src, height = "80vh" }) {
  const shellRef = useRef(null);
  const canvasRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");

  // Block common save/print shortcuts while focused
  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "o")) {
      e.preventDefault();
    }
  };

  // Load the PDF document
  useEffect(() => {
    let cancelled = false;
    setErr("");
    setDoc(null);
    setNumPages(0);
    setPage(1);

    const loadingTask = pdfjsLib.getDocument({
      url: src,
      // With your server-side Range support, streaming works well:
      rangeChunkSize: 65536,
      disableAutoFetch: false,
      disableStream: false,
      withCredentials: false
    });

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) return;
        setDoc(pdf);
        setNumPages(pdf.numPages);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e?.message || String(e));
      });

    return () => {
      cancelled = true;
      try { loadingTask.destroy(); } catch {}
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
        const viewportAtScale1 = pdfPage.getViewport({ scale: 1 });
        const scale = containerWidth / viewportAtScale1.width;
        const viewport = pdfPage.getViewport({ scale });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // High-quality rendering
        const renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport,
          intent: "display"
        });
        await renderTask.promise;
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      }
    })();

    // Re-render on container resize
    const observer = new ResizeObserver(() => {
      // trigger re-render by updating page (same value)
      setPage((p) => p);
    });
    observer.observe(shellRef.current);

    return () => {
      cancelled = true;
      try { observer.disconnect(); } catch {}
    };
  }, [doc, page]);

  if (err) {
    return (
      <div className="p-4 text-red-600">
        Failed to load PDF: {err}
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className="pdf-shell no-print select-none"
      style={{
        height,
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        background: "#fff",
        overflow: "auto", // scroll outer container
        position: "relative",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={onKeyDown}
      tabIndex={0} // focus to capture keydown
    >
      {/* Minimal pager — only "go to page" allowed */}
      <div
        className="absolute top-2 right-2 z-10"
        style={{
          background: "rgba(255,255,255,0.9)",
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

      {/* Rendered page */}
      <div
        className="flex items-start justify-center p-4"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none" }}
      >
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}

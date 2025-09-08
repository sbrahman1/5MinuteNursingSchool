import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// (Optional) these styles are nice-to-have; remove if they ever break builds
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ Load worker from same origin (no CORS/module issues)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export default function PdfViewer({ src, width = 820, height = "80vh" }) {
  const [numPages, setNumPages] = useState(null);
  const [err, setErr] = useState("");

  return (
    <div className="w-full">
      {err ? (
        <div className="p-4 text-red-600">
          Failed to load PDF: {err}{" "}
          <a href={src} className="text-blue-600 underline" target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </div>
      ) : (
        <Document
          file={src}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => setErr(e?.message || String(e))}
          loading={<div className="p-4">Loading PDF…</div>}
        >
          {Array.from({ length: numPages || 0 }, (_, i) => (
            <Page key={i} pageNumber={i + 1} width={width} height={height} />
          ))}
        </Document>
      )}
    </div>
  );
}

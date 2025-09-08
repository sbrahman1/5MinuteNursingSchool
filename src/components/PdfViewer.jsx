import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// PDF.js CSS (recommended by react-pdf)
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// ✅ Use unpkg, pinned to the installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

// src/components/PdfViewer.jsx
import React from "react";

export default function PdfViewer({ src, height = "80vh" }) {
  return (
    <div
      className="w-full"
      onContextMenu={(e) => e.preventDefault()} // light deterrent
      style={{ userSelect: "none" }}
    >
      <iframe
        title="PDF preview"
        // Hide Chrome/Edge toolbar + nav panes; Fit to width
        src={`${src}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
        className="w-full"
        style={{ height, border: "none" }}
        loading="lazy"
        // IMPORTANT: sandbox without "allow-downloads" blocks viewer-initiated downloads/popups
        // allow-same-origin + allow-scripts are required for the built-in viewer to run.
        sandbox="allow-scripts allow-same-origin"
        // Don't leak referrer to the PDF URL
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

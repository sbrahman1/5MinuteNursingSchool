import React from "react";

export default function PdfViewer({ src, height = "80vh" }) {
  const blockKeys = (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (k === "s" || k === "p" || k === "o")) e.preventDefault();
  };

  return (
    <div
      className="w-full"
      style={{ userSelect: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={blockKeys}
      tabIndex={0}
    >
      <iframe
        title="PDF preview"
        src={`${src}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
        className="w-full"
        style={{ height, border: "none" }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

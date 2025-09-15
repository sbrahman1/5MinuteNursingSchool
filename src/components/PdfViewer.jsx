import React from "react";

export default function PdfViewer({ src, height = "80vh" }) {
  // light deterrents against save/print shortcuts
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
      tabIndex={0} // make div focusable so it can capture keydown
    >
      <iframe
        title="PDF preview"
        // hide UI; fit to width
        src={`${src}#toolbar=0&navpanes=0&statusbar=0&view=FitH`}
        className="w-full"
        style={{ height, border: "none" }}
        loading="lazy"
        // 👇 allow the viewer to run in Edge, but do NOT allow downloads
        sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

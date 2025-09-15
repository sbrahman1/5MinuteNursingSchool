import React from "react";

export default function PdfViewer({ src, height = "80vh" }) {
  return (
    <div className="w-full">
      <iframe
        title="PDF preview"
        src={`${src}#toolbar=1`}
        className="w-full"
        style={{ height }}
        loading="lazy"
      />
      <div className="text-sm text-gray-500 mt-2">
        Having trouble?{" "}
        <a href={src} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          Open the PDF in a new tab
        </a>
        .
      </div>
    </div>
  );
}

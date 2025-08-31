import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ src }) {
  const [numPages, setNumPages] = useState(1);

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow p-2">
      <Document file={src} onLoadSuccess={(p) => setNumPages(p.numPages)}>
        {Array.from({ length: numPages }, (_, i) => (
          <Page key={i} pageNumber={i + 1} width={640} />
        ))}
      </Document>
    </div>
  );
}

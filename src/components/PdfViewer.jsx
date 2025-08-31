import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PdfViewer({ src }) {
  const [numPages, setNumPages] = useState(1)
  return (
    <div className="pdf-box">
      <Document file={src} onLoadSuccess={(p)=>setNumPages(p.numPages)}>
        {Array.from({length:numPages}, (_,i)=>(
          <Page key={i} pageNumber={i+1} width={640} />
        ))}
      </Document>
    </div>
  )
}

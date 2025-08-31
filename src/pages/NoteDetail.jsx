import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import PdfViewer from "../components/PdfViewer"
import "./detail.css"

export default function NoteDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)

  useEffect(() => {
    fetch(`/api/posts/${slug}`).then(r=>r.json()).then(setPost)
  }, [slug])

  if (!post) return null

  return (
    <div className="detail-wrap">
      <div className="left">
        <PdfViewer src={`/api/posts/${post.slug}/pdf`} />
      </div>
      <aside className="right">
        <h1>{post.title}</h1>
        <div className="date">{new Date(post.published_at).toLocaleDateString()}</div>
        <p className="summary">{post.summary}</p>
      </aside>
    </div>
  )
}

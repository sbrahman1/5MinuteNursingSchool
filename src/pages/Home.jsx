import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import "./home.css"

export default function Home() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    fetch("/api/posts").then(r=>r.json()).then(setPosts)
  }, [])

  return (
    <div className="wrap">
      <header className="hero">
        <h1>Study notes</h1>
        <p>Dive into a world of study, life, nursing, and art</p>
      </header>

      <main className="grid">
        {posts.map(p => (
          <Link key={p.slug} to={`/home/${p.slug}`} className="card">
            <div className="card-body">
              <h2>{p.title}</h2>
              <p className="summary">{p.summary}</p>
              <div className="date">{new Date(p.published_at).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
      </main>

      <footer className="footer">
        <div>
          <h3>About me</h3>
          <p>Nursing educator sharing concise class notes.</p>
          <p>📍 Dhaka, Bangladesh</p>
        </div>
        <div>
          <h3>Address</h3>
          <p>5-Minute Nursing School</p>
          <p>Dhaka, Bangladesh</p>
        </div>
        <div className="social">
          <a href="https://youtube.com/@5MinuteNursingSchool" target="_blank" rel="noreferrer" aria-label="YouTube">📺</a>
          <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
          <a href="https://pinterest.com/" target="_blank" rel="noreferrer" aria-label="Pinterest">📌</a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X">𝕏</a>
        </div>
      </footer>
    </div>
  )
}

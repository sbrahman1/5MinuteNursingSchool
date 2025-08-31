import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // backend route from Cloudflare Pages Functions (you’ll add later)
    fetch("/api/posts")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-emerald-50">
      <header className="py-10 text-center">
        <h1 className="text-4xl font-bold">Study notes</h1>
        <p className="text-gray-600 mt-2">
          Dive into a world of study, life, nursing, and art
        </p>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        {posts.length === 0 && (
          <div className="text-center text-gray-500 col-span-full">
            No notes yet. (Create one in /admin)
          </div>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            to={`/home/${p.slug}`}
            className="group border rounded-2xl bg-white/80 backdrop-blur shadow hover:shadow-lg transition transform hover:-translate-y-0.5 p-6"
          >
            <h2 className="text-xl font-semibold group-hover:text-emerald-700">
              {p.title}
            </h2>
            <p className="text-gray-600 mt-2 line-clamp-3">{p.summary}</p>
            <div className="text-sm text-gray-500 mt-3">
              {p.published_at
                ? new Date(p.published_at).toLocaleDateString()
                : ""}
            </div>
          </Link>
        ))}
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-16">
      <div className="max-w-6xl mx-auto py-8 px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold">About me</h3>
          <p className="text-sm mt-2">Nursing educator sharing concise class notes.</p>
          <p className="text-xs mt-2">📍 Dhaka, Bangladesh</p>
        </div>
        <div>
          <h3 className="font-semibold">Address</h3>
          <p className="text-sm mt-2">5-Minute Nursing School</p>
          <p className="text-sm">Dhaka, Bangladesh</p>
        </div>
        <div className="flex items-start gap-4 text-2xl">
          <a href="https://youtube.com/@5MinuteNursingSchool" target="_blank" rel="noreferrer" aria-label="YouTube">📺</a>
          <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
          <a href="https://pinterest.com/" target="_blank" rel="noreferrer" aria-label="Pinterest">📌</a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" aria-label="X">𝕏</a>
        </div>
      </div>
    </footer>
  );
}

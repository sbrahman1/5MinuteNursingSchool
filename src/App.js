import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import NoteDetail from "./pages/NoteDetail";
import Admin from "./pages/Admin";
import AdminEdit from "./pages/AdminEdit";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => setDarkMode((v) => !v);

  return (
    <BrowserRouter>
      <div
        className={`min-h-screen transition-all duration-500 ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={<Landing darkMode={darkMode} toggleTheme={toggleTheme} />}
          />
          <Route path="/home" element={<Home />} />
          <Route path="/home/:slug" element={<NoteDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit/:slug" element={<AdminEdit />} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Inline landing page
function Landing({ darkMode, toggleTheme }) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 transition-all duration-500">
      <div
        className={`shadow-lg rounded-2xl p-6 max-w-md text-center transition-transform duration-300 hover:scale-105 ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
      >
        <h1 className="text-3xl font-bold hover:text-blue-500 transition-colors duration-300">
          Hello,Its Mimion !
        </h1>
        <p className="mt-2 hover:text-gray-400 transition-colors duration-300">
          A tiny little girl ( Who loves Alu 🥔).
        </p>

        <button
          onClick={toggleTheme}
          className={`mt-4 px-6 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ${
            darkMode
              ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500"
              : "bg-blue-500 text-white hover:bg-blue-700"
          }`}
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>

        <div className="mt-4">
          <Link
            to="/home"
            className="inline-block px-5 py-2 rounded-lg shadow bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            Dive into a world of study, life, nursing, and art
          </Link>
        </div>
      </div>
    </div>
  );
}

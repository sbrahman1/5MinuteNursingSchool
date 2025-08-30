import React, { useState } from "react";

function App() {
  const [darkMode, setDarkMode] = useState(false); // ✅ State to track theme

  // Function to toggle dark mode
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4 transition-all duration-500 ${
      darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
    }`}>
      <div className={`shadow-lg rounded-2xl p-6 max-w-md text-center transition-transform duration-300 hover:scale-105 ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}>
        <h1 className="text-3xl font-bold hover:text-blue-500 transition-colors duration-300">
          Hello,Its Mimion !
        </h1>
        <p className="mt-2 hover:text-gray-400 transition-colors duration-300">
          A tiny little girl ( Who loves alu 🥔).
        </p>
        <button
          onClick={toggleTheme}
          className={`mt-4 px-6 py-2 font-semibold rounded-lg shadow-md transition-all duration-300 ${
            darkMode ? "bg-yellow-400 text-gray-900 hover:bg-yellow-500" : "bg-blue-500 text-white hover:bg-blue-700"
          }`}
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>
    </div>
  );
}

export default App;

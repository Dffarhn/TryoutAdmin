"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DarkModeContext = createContext(null);

export function DarkModeProvider({ children }) {
  // Selalu light mode - tidak ada dark mode
  const [isDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pastikan selalu light mode
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  }, []);

  // Toggle tidak melakukan apa-apa karena selalu light mode
  const toggleDarkMode = () => {
    // Tidak ada aksi - selalu light mode
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within DarkModeProvider");
  }
  return context;
}


"use client";

import { useDarkMode } from "@/contexts/DarkModeContext";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DarkModeToggle({ className }) {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className={cn(
        "p-2 rounded-lg transition-colors",
        "bg-gray-100 hover:bg-gray-200",
        "dark:bg-slate-700 dark:hover:bg-slate-600",
        "text-gray-700 dark:text-gray-200",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}


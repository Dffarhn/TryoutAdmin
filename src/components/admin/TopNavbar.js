"use client";

import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { UserDropdown } from "./UserDropdown";
import { Input } from "@/components/ui/Input";

export function TopNavbar({ session, onSignOut, onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    // Placeholder untuk search functionality
    console.log("Search:", searchQuery);
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left side - Hamburger & Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Hamburger Button (Mobile) */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tryout, paket, kategori..."
                className="pl-10 w-full"
              />
            </div>
          </form>
        </div>

        {/* Right side - User dropdown */}
        <div className="flex items-center gap-2">
          <UserDropdown session={session} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}

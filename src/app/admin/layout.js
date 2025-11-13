"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopNavbar } from "@/components/admin/TopNavbar";
import { Breadcrumb } from "@/components/admin/Breadcrumb";

/**
 * AdminLayout
 * Layout khusus untuk halaman admin panel.
 * Fokus pada tampilan desktop/laptop — gunakan layout full width.
 * Menggunakan sidebar navigasi kiri + top navbar untuk desain profesional modern.
 * Jangan center content, gunakan grid atau flex untuk mengatur spacing.
 */
export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/admin/session");
        const json = await res.json();
        setSession(json.data);
      } catch (error) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }

    if (mounted) {
      checkSession();
    }
  }, [mounted]);

  useEffect(() => {
    if (!loading && mounted && !redirectingRef.current) {
      const currentPath = pathname || "";
      const isLoginPage = currentPath.startsWith("/admin/login");
      
      // Only redirect if necessary and not already on the target page
      if (!session && !isLoginPage) {
        // User not logged in and not on login page -> redirect to login
        redirectingRef.current = true;
        router.replace("/admin/login");
      } else if (session && isLoginPage) {
        // User logged in but on login page -> redirect to dashboard
        redirectingRef.current = true;
        router.replace("/admin/dashboard");
      }
    }
  }, [session, loading, mounted]); // Only depend on session/loading changes, not pathname

  // Reset redirecting flag when pathname changes (after navigation completes)
  useEffect(() => {
    // Reset flag after navigation completes
    const timer = setTimeout(() => {
      redirectingRef.current = false;
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  const isLogin = pathname?.startsWith("/admin/login");
  if (isLogin) return children;

  async function handleSignOut() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
      document.cookie = "admin_id=; path=/; max-age=0";
      setSession(null);
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar - Fixed Left */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Content Area - dengan margin untuk sidebar */}
      <div className="lg:ml-64 flex-1 min-h-screen transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar 
          session={session} 
          onSignOut={handleSignOut}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}

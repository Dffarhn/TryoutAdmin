"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export default function AdminLoginPage() {
  const router = useRouter();
  const usernameRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auto-focus username field on mount
  useEffect(() => {
    setMounted(true);
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!username.trim() || !password) {
        setError("Username dan password wajib diisi");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Login gagal");
      }

      // Set cookie via document.cookie (will be handled by browser)
      document.cookie = `admin_id=${json.data.id}; path=/; max-age=86400`; // 24 hours

      // Reload page to trigger session check in layout
      // Layout will automatically redirect to dashboard if session exists
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err?.message || "Login gagal");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 sm:px-6 lg:px-8 py-12">
      <div
        className={cn(
          "w-full max-w-md transition-all duration-500 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <Card className="shadow-2xl border-0">
          {/* Branding Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 rounded-t-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Tryout Admin
              </h1>
              <p className="text-blue-100 text-sm">
                Masuk ke panel administrasi
              </p>
            </div>
          </div>

          <CardContent className="px-8 py-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={usernameRef}
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Masukkan username"
                    disabled={loading}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 border rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200",
                      "disabled:bg-gray-50 disabled:cursor-not-allowed",
                      error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    )}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Masukkan password"
                    disabled={loading}
                    className={cn(
                      "w-full pl-10 pr-12 py-3 border rounded-lg",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200",
                      "disabled:bg-gray-50 disabled:cursor-not-allowed",
                      error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className={cn(
                    "flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg",
                    "text-sm text-red-700 animate-in slide-in-from-top-2 duration-300"
                  )}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Memproses...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Sistem Manajemen Tryout
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

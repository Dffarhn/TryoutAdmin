"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchDashboardStats() {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat statistik dashboard");
  const json = await res.json();
  return json.data || {};
}

async function fetchDashboardMetrics() {
  const res = await fetch("/api/dashboard/metrics", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat metrics dashboard");
  const json = await res.json();
  return json.data || {};
}

async function fetchRecentAttempts() {
  const res = await fetch("/api/dashboard/attempts", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat recent attempts");
  const json = await res.json();
  return json.data || [];
}

async function fetchRecentActivities() {
  const res = await fetch("/api/dashboard/activities", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat recent activities");
  const json = await res.json();
  return json.data || [];
}

async function fetchDashboardHealth() {
  const res = await fetch("/api/dashboard/health", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat health check");
  const json = await res.json();
  return json.data || { warnings: [] };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentAttempts() {
  return useQuery({
    queryKey: ["dashboard-recent-attempts"],
    queryFn: fetchRecentAttempts,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for recent data)
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ["dashboard-recent-activities"],
    queryFn: fetchRecentActivities,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDashboardHealth() {
  return useQuery({
    queryKey: ["dashboard-health"],
    queryFn: fetchDashboardHealth,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


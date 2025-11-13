"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchTryoutSessions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.subscriptionTypeId) params.append("subscription_type_id", filters.subscriptionTypeId);
  if (filters.packageId) params.append("package_id", filters.packageId);
  if (filters.isActive !== undefined) params.append("is_active", filters.isActive);

  const url = `/api/tryout-sessions${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat tryout sessions");
  const json = await res.json();
  return json.data || [];
}

async function fetchTryoutSession(id) {
  const res = await fetch(`/api/tryout-sessions/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat tryout session");
  }
  const json = await res.json();
  return json.data;
}

async function fetchUserAvailableSessions(userId) {
  const res = await fetch(`/api/tryout-sessions/user/${userId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat available sessions");
  const json = await res.json();
  return json.data || [];
}

async function createTryoutSession(data) {
  const res = await fetch("/api/tryout-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat tryout session");
  }
  const json = await res.json();
  return json.data;
}

async function updateTryoutSession(id, data) {
  const res = await fetch(`/api/tryout-sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate tryout session");
  }
  const json = await res.json();
  return json.data;
}

async function deleteTryoutSession(id) {
  const res = await fetch(`/api/tryout-sessions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus tryout session");
  }
}

export function useTryoutSessions(filters) {
  return useQuery({
    queryKey: ["tryout-sessions", filters],
    queryFn: () => fetchTryoutSessions(filters),
  });
}

export function useTryoutSession(id) {
  return useQuery({
    queryKey: ["tryout-session", id],
    queryFn: () => fetchTryoutSession(id),
    enabled: !!id,
  });
}

export function useUserAvailableSessions(userId) {
  return useQuery({
    queryKey: ["user-available-sessions", userId],
    queryFn: () => fetchUserAvailableSessions(userId),
    enabled: !!userId,
  });
}

export function useCreateTryoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTryoutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tryout-sessions"] });
    },
  });
}

export function useUpdateTryoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTryoutSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tryout-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tryout-session", variables.id] });
    },
  });
}

export function useDeleteTryoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTryoutSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tryout-sessions"] });
    },
  });
}


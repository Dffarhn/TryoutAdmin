"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchUserSubscriptions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.userId) params.append("user_id", filters.userId);
  if (filters.isActive !== undefined) params.append("is_active", filters.isActive);

  const url = `/api/user-subscriptions${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat user subscriptions");
  const json = await res.json();
  return json.data || [];
}

async function fetchUserSubscription(id) {
  const res = await fetch(`/api/user-subscriptions/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat user subscription");
  }
  const json = await res.json();
  return json.data;
}

async function fetchActiveSubscriptions(userId) {
  const res = await fetch(`/api/user-subscriptions/active?user_id=${userId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat active subscriptions");
  const json = await res.json();
  return json.data || [];
}

async function createUserSubscription(data) {
  const res = await fetch("/api/user-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat user subscription");
  }
  const json = await res.json();
  return json.data;
}

async function updateUserSubscription(id, data) {
  const res = await fetch(`/api/user-subscriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate user subscription");
  }
  const json = await res.json();
  return json.data;
}

export function useUserSubscriptions(filters) {
  return useQuery({
    queryKey: ["user-subscriptions", filters],
    queryFn: () => fetchUserSubscriptions(filters),
    enabled: !!filters?.userId,
  });
}

export function useUserSubscription(id) {
  return useQuery({
    queryKey: ["user-subscription", id],
    queryFn: () => fetchUserSubscription(id),
    enabled: !!id,
  });
}

export function useActiveSubscriptions(userId) {
  return useQuery({
    queryKey: ["active-subscriptions", userId],
    queryFn: () => fetchActiveSubscriptions(userId),
    enabled: !!userId,
  });
}

export function useCreateUserSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
    },
  });
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => updateUserSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}


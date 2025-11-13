"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchSubscriptionTypes() {
  const res = await fetch("/api/subscription-types", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat subscription types");
  const json = await res.json();
  return json.data || [];
}

async function fetchSubscriptionType(id) {
  const res = await fetch(`/api/subscription-types/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat subscription type");
  }
  const json = await res.json();
  return json.data;
}

async function createSubscriptionType(data) {
  const res = await fetch("/api/subscription-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat subscription type");
  }
  const json = await res.json();
  return json.data;
}

async function updateSubscriptionType(id, data) {
  const res = await fetch(`/api/subscription-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate subscription type");
  }
  const json = await res.json();
  return json.data;
}

async function deleteSubscriptionType(id) {
  const res = await fetch(`/api/subscription-types/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus subscription type");
  }
}

export function useSubscriptionTypes() {
  return useQuery({
    queryKey: ["subscription-types"],
    queryFn: fetchSubscriptionTypes,
  });
}

export function useSubscriptionType(id) {
  return useQuery({
    queryKey: ["subscription-type", id],
    queryFn: () => fetchSubscriptionType(id),
    enabled: !!id,
  });
}

export function useCreateSubscriptionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubscriptionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-types"] });
    },
  });
}

export function useUpdateSubscriptionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSubscriptionType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-types"] });
      queryClient.invalidateQueries({ queryKey: ["subscription-type", variables.id] });
    },
  });
}

export function useDeleteSubscriptionType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubscriptionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-types"] });
    },
  });
}


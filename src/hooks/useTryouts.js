"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchTryouts() {
  const res = await fetch("/api/tryouts", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat tryouts");
  const json = await res.json();
  return json.data || [];
}

async function fetchTryout(id) {
  const res = await fetch(`/api/tryouts/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat tryout");
  }
  const json = await res.json();
  return json.data;
}

async function createTryout(data) {
  const res = await fetch("/api/tryouts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat tryout");
  }
  const json = await res.json();
  return json.data;
}

async function updateTryout(id, data) {
  const res = await fetch(`/api/tryouts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate tryout");
  }
  const json = await res.json();
  return json.data;
}

async function deleteTryout(id) {
  const res = await fetch(`/api/tryouts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus tryout");
  }
}

async function fetchTryoutsByPackage(packageId) {
  const res = await fetch(`/api/packages/${packageId}/tryouts`, {
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error("Gagal memuat tryouts untuk paket");
  }
  const json = await res.json();
  return json.data || [];
}

export function useTryouts() {
  return useQuery({
    queryKey: ["tryouts"],
    queryFn: fetchTryouts,
  });
}

export function useTryout(id) {
  return useQuery({
    queryKey: ["tryout", id],
    queryFn: () => fetchTryout(id),
    enabled: !!id,
  });
}

export function useCreateTryout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTryout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tryouts"] });
    },
  });
}

export function useUpdateTryout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTryout(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tryouts"] });
      queryClient.invalidateQueries({ queryKey: ["tryout", variables.id] });
    },
  });
}

export function useDeleteTryout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTryout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tryouts"] });
      queryClient.invalidateQueries({ queryKey: ["tryouts-by-package"] });
    },
  });
}

export function useTryoutsByPackage(packageId) {
  return useQuery({
    queryKey: ["tryouts-by-package", packageId],
    queryFn: () => fetchTryoutsByPackage(packageId),
    enabled: !!packageId,
  });
}


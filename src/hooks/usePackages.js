"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchPackages(isActive = null) {
  const url =
    isActive !== null
      ? `/api/packages?is_active=${isActive}`
      : "/api/packages";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat packages");
  const json = await res.json();
  return json.data || [];
}

async function fetchPackage(id) {
  const res = await fetch(`/api/packages/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat package");
  }
  const json = await res.json();
  return json.data;
}

async function createPackage(data) {
  const res = await fetch("/api/packages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat package");
  }
  const json = await res.json();
  return json.data;
}

async function updatePackage(id, data) {
  const res = await fetch(`/api/packages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate package");
  }
  const json = await res.json();
  return json.data;
}

async function deletePackage(id) {
  const res = await fetch(`/api/packages/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus package");
  }
}

export function usePackages(isActive = null) {
  return useQuery({
    queryKey: ["packages", isActive],
    queryFn: () => fetchPackages(isActive),
  });
}

export function usePackage(id) {
  return useQuery({
    queryKey: ["package", id],
    queryFn: () => fetchPackage(id),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updatePackage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["package", variables.id] });
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}


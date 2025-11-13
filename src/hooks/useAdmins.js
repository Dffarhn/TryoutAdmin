"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchAdmins(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.isActive !== undefined) {
    searchParams.append("is_active", String(params.isActive));
  }
  if (params.isSuperAdmin !== undefined) {
    searchParams.append("is_super_admin", String(params.isSuperAdmin));
  }

  const url = `/api/admin${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat daftar admin");
  const json = await res.json();
  return json.data || [];
}

async function fetchAdmin(id) {
  const res = await fetch(`/api/admin/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat data admin");
  }
  const json = await res.json();
  return json.data;
}

async function createAdmin(data) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    // Handle validation errors
    if (error.details && Array.isArray(error.details)) {
      const firstError = error.details[0];
      throw new Error(firstError.message || error.error || "Gagal membuat admin");
    }
    throw new Error(error.error || "Gagal membuat admin");
  }
  const json = await res.json();
  return json.data;
}

async function updateAdmin(id, data) {
  const res = await fetch(`/api/admin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Gagal mengupdate admin");
  }
  const json = await res.json();
  return json.data;
}

async function deleteAdmin(id) {
  const res = await fetch(`/api/admin/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Gagal menghapus admin");
  }
  const json = await res.json();
  return json;
}

export function useAdmins(params = {}) {
  return useQuery({
    queryKey: ["admins", params],
    queryFn: () => fetchAdmins(params),
  });
}

export function useAdmin(id) {
  return useQuery({
    queryKey: ["admin", id],
    queryFn: () => fetchAdmin(id),
    enabled: !!id,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdmin(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", variables.id] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });
}


"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.userId) params.append("user_id", filters.userId);
  if (filters.paymentStatus) params.append("payment_status", filters.paymentStatus);

  const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat transactions");
  const json = await res.json();
  return json.data || [];
}

async function fetchTransaction(id) {
  const res = await fetch(`/api/transactions/${id}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat transaction");
  }
  const json = await res.json();
  return json.data;
}

async function createTransaction(data) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat transaction");
  }
  const json = await res.json();
  return json.data;
}

async function updateTransaction(id, data) {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate transaction");
  }
  const json = await res.json();
  return json.data;
}

export function useTransactions(filters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });
}

export function useTransaction(id) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] });
    },
  });
}

async function deleteTransaction(id) {
  const res = await fetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus transaksi");
  }
  const json = await res.json();
  return json;
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}


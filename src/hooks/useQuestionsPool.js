"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchQuestionsPool(search = "", limit = 50, offset = 0, categoryId = null) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (categoryId) params.append("categoryId", categoryId);
  params.append("limit", String(limit));
  params.append("offset", String(offset));

  const res = await fetch(`/api/questions?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal memuat pool soal");
  const json = await res.json();
  return {
    questions: json.data || [],
    total: json.total || 0,
    limit: json.limit || limit,
    offset: json.offset || offset,
  };
}

async function createQuestion(data) {
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat soal");
  }
  const json = await res.json();
  return json.data;
}

export function useQuestionsPool(search = "", limit = 50, offset = 0, categoryId = null) {
  return useQuery({
    queryKey: ["questions-pool", search, limit, offset, categoryId],
    queryFn: () => fetchQuestionsPool(search, limit, offset, categoryId),
  });
}

export function useCreateQuestionPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions-pool"] });
    },
  });
}

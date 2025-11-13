"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchQuestions(tryoutId) {
  const res = await fetch(`/api/tryouts/${tryoutId}/questions`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal memuat questions");
  const json = await res.json();
  return json.data || [];
}

async function fetchQuestion(tryoutId, questionId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/questions/${questionId}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat question");
  }
  const json = await res.json();
  return json.data;
}

async function createQuestion(tryoutId, data) {
  const res = await fetch(`/api/tryouts/${tryoutId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat question");
  }
  const json = await res.json();
  return json.data;
}

async function updateQuestion(tryoutId, questionId, data) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/questions/${questionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate question");
  }
  const json = await res.json();
  return json.data;
}

async function deleteQuestion(tryoutId, questionId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/questions/${questionId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus question");
  }
}

export function useQuestions(tryoutId) {
  return useQuery({
    queryKey: ["questions", tryoutId],
    queryFn: () => fetchQuestions(tryoutId),
    enabled: !!tryoutId,
  });
}

export function useQuestion(tryoutId, questionId) {
  return useQuery({
    queryKey: ["question", tryoutId, questionId],
    queryFn: () => fetchQuestion(tryoutId, questionId),
    enabled: !!tryoutId && !!questionId,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, data }) => createQuestion(tryoutId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.tryoutId],
      });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, questionId, data }) =>
      updateQuestion(tryoutId, questionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.tryoutId],
      });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.tryoutId, variables.questionId],
      });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, questionId }) =>
      deleteQuestion(tryoutId, questionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["questions", variables.tryoutId],
      });
    },
  });
}


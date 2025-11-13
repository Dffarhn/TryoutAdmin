"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchSubChapterQuestions(tryoutId, subChapterId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}/questions`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Gagal memuat soal sub-chapter");
  const json = await res.json();
  return json.data || [];
}

async function assignQuestionToSubChapter(tryoutId, subChapterId, data) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}/questions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menambahkan soal ke sub-chapter");
  }
  const json = await res.json();
  return json.data;
}

async function updateQuestionOrder(tryoutId, subChapterId, questionSubChapterId, data) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}/questions/${questionSubChapterId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate urutan");
  }
  const json = await res.json();
  return json.data;
}

async function removeQuestionFromSubChapter(tryoutId, subChapterId, questionSubChapterId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}/questions/${questionSubChapterId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus soal dari sub-chapter");
  }
}

export function useSubChapterQuestions(tryoutId, subChapterId) {
  return useQuery({
    queryKey: ["sub-chapter-questions", tryoutId, subChapterId],
    queryFn: () => fetchSubChapterQuestions(tryoutId, subChapterId),
    enabled: !!tryoutId && !!subChapterId,
  });
}

export function useAssignQuestionToSubChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, subChapterId, data }) =>
      assignQuestionToSubChapter(tryoutId, subChapterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapter-questions", variables.tryoutId, variables.subChapterId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sub-chapters", variables.tryoutId],
      });
    },
  });
}

export function useUpdateQuestionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, subChapterId, questionSubChapterId, data }) =>
      updateQuestionOrder(tryoutId, subChapterId, questionSubChapterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapter-questions", variables.tryoutId, variables.subChapterId],
      });
    },
  });
}

export function useRemoveQuestionFromSubChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, subChapterId, questionSubChapterId }) =>
      removeQuestionFromSubChapter(tryoutId, subChapterId, questionSubChapterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapter-questions", variables.tryoutId, variables.subChapterId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sub-chapters", variables.tryoutId],
      });
    },
  });
}


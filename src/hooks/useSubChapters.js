"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function fetchSubChapters(tryoutId) {
  const res = await fetch(`/api/tryouts/${tryoutId}/sub-chapters`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Gagal memuat sub-chapters");
  const json = await res.json();
  return json.data || [];
}

async function fetchSubChapter(tryoutId, subChapterId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Gagal memuat sub-chapter");
  }
  const json = await res.json();
  return json.data;
}

async function createSubChapter(tryoutId, data) {
  const res = await fetch(`/api/tryouts/${tryoutId}/sub-chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal membuat sub-chapter");
  }
  const json = await res.json();
  return json.data;
}

async function updateSubChapter(tryoutId, subChapterId, data) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal mengupdate sub-chapter");
  }
  const json = await res.json();
  return json.data;
}

async function deleteSubChapter(tryoutId, subChapterId) {
  const res = await fetch(
    `/api/tryouts/${tryoutId}/sub-chapters/${subChapterId}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.error || "Gagal menghapus sub-chapter");
  }
}

export function useSubChapters(tryoutId) {
  return useQuery({
    queryKey: ["sub-chapters", tryoutId],
    queryFn: () => fetchSubChapters(tryoutId),
    enabled: !!tryoutId,
  });
}

export function useSubChapter(tryoutId, subChapterId) {
  return useQuery({
    queryKey: ["sub-chapter", tryoutId, subChapterId],
    queryFn: () => fetchSubChapter(tryoutId, subChapterId),
    enabled: !!tryoutId && !!subChapterId,
  });
}

export function useCreateSubChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, data }) => createSubChapter(tryoutId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapters", variables.tryoutId],
      });
    },
  });
}

export function useUpdateSubChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, subChapterId, data }) =>
      updateSubChapter(tryoutId, subChapterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapters", variables.tryoutId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sub-chapter", variables.tryoutId, variables.subChapterId],
      });
    },
  });
}

export function useDeleteSubChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tryoutId, subChapterId }) =>
      deleteSubChapter(tryoutId, subChapterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sub-chapters", variables.tryoutId],
      });
    },
  });
}


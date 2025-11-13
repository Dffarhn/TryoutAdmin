"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTryout } from "@/hooks/useTryouts";
import { useSubChapters } from "@/hooks/useSubChapters";
import {
  useSubChapterQuestions,
  useRemoveQuestionFromSubChapter,
} from "@/hooks/useQuestionSubChapters";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SubChapterQuestionsSection } from "@/components/admin/SubChapterQuestionsSection";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";

export default function QuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: tryout, isLoading: tryoutLoading } = useTryout(tryoutId);
  const { data: subChapters = [], isLoading: subChaptersLoading } =
    useSubChapters(tryoutId);
  const removeQuestion = useRemoveQuestionFromSubChapter();
  const [expandedSubChapters, setExpandedSubChapters] = useState({});
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  function toggleSubChapter(subChapterId) {
    setExpandedSubChapters((prev) => ({
      ...prev,
      [subChapterId]: !prev[subChapterId],
    }));
  }

  async function handleRemoveQuestion(subChapterId, questionSubChapterId, questionText) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Soal",
      description: `Apakah Anda yakin ingin menghapus soal dari sub-chapter ini?\n\n"${questionText.substring(0, 50)}..."`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await removeQuestion.mutateAsync({
        tryoutId,
        subChapterId,
        questionSubChapterId,
      });
      showToast("Soal berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus soal: ${error.message}`, "error");
    }
  }

  if (tryoutLoading || subChaptersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">Tryout tidak ditemukan</p>
        <Link href="/admin/tryouts">
          <Button>Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Soal - {tryout.title}
          </h1>
          <p className="text-gray-600 mt-2">
            Kelola soal per sub-bab untuk tryout ini
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/tryouts/${tryoutId}/edit`}>
            <Button variant="secondary">Edit Tryout</Button>
          </Link>
        </div>
      </div>

      {subChapters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Belum ada sub-bab. Buat sub-bab terlebih dahulu di halaman edit tryout.
            </p>
            <Link href={`/admin/tryouts/${tryoutId}/edit`}>
              <Button>Buat Sub-Bab</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {subChapters.map((subChapter) => (
            <SubChapterQuestionsSection
              key={subChapter.id}
              tryoutId={tryoutId}
              subChapter={subChapter}
              isExpanded={expandedSubChapters[subChapter.id]}
              onToggle={() => toggleSubChapter(subChapter.id)}
              onRemoveQuestion={handleRemoveQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}


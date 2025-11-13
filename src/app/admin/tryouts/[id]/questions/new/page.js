"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTryout } from "@/hooks/useTryouts";
import { useQuestions, useCreateQuestion } from "@/hooks/useQuestions";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";

export default function NewQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: tryout, isLoading: tryoutLoading } = useTryout(tryoutId);
  const { data: questions = [] } = useQuestions(tryoutId);
  const createQuestion = useCreateQuestion();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createQuestion.mutateAsync({
        tryoutId,
        data,
      });
      showToast("Soal berhasil dibuat!", "success");
      router.push(`/admin/tryouts/${tryoutId}/questions`);
    } catch (error) {
      showToast(`Gagal menyimpan: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push(`/admin/tryouts/${tryoutId}/questions`);
  }

  if (tryoutLoading) {
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

  const nextNomor = questions.length > 0 
    ? Math.max(...questions.map(q => q.nomor)) + 1 
    : 1;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/tryouts/${tryoutId}/questions`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke Daftar Soal
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Soal</h1>
        <p className="text-gray-600 mt-2">
          Tambah soal baru untuk tryout: {tryout.title}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Soal</CardTitle>
          <CardDescription>
            Lengkapi informasi soal di bawah ini. Minimal 2 opsi jawaban, dan
            harus ada 1 jawaban benar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm
            initialData={{ nomor: nextNomor }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createQuestion.isPending}
            submitLabel="Simpan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useParams, useRouter } from "next/navigation";
import { useTryout } from "@/hooks/useTryouts";
import {
  useQuestion,
  useUpdateQuestion,
} from "@/hooks/useQuestions";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const questionId = Array.isArray(params?.questionId)
    ? params.questionId[0]
    : params?.questionId;
  const { data: tryout, isLoading: tryoutLoading } = useTryout(tryoutId);
  const { data: question, isLoading: questionLoading } = useQuestion(
    tryoutId,
    questionId
  );
  const updateQuestion = useUpdateQuestion();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await updateQuestion.mutateAsync({
        tryoutId,
        questionId,
        data,
      });
      showToast("Soal berhasil disimpan", "success");
      router.push(`/admin/tryouts/${tryoutId}/questions`);
    } catch (error) {
      showToast(`Gagal menyimpan soal: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push(`/admin/tryouts/${tryoutId}/questions`);
  }

  if (tryoutLoading || questionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat soal...</p>
      </div>
    );
  }

  if (!tryout || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">
          {!tryout ? "Tryout tidak ditemukan" : "Soal tidak ditemukan"}
        </p>
        <Link href="/admin/tryouts">
          <Button>Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Soal</h1>
        <p className="text-gray-600 mt-2">
          Edit soal untuk tryout: {tryout.title}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Soal</CardTitle>
          <CardDescription>
            Edit informasi soal di bawah ini. Minimal 2 opsi jawaban, dan
            harus ada 1 jawaban benar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionForm
            initialData={question}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateQuestion.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}


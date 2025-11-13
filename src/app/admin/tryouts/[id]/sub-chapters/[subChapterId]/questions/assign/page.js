"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTryout } from "@/hooks/useTryouts";
import { useSubChapters } from "@/hooks/useSubChapters";
import { useCategories } from "@/hooks/useCategories";
import {
  useQuestionsPool,
  useCreateQuestionPool,
} from "@/hooks/useQuestionsPool";
import {
  useAssignQuestionToSubChapter,
  useSubChapterQuestions,
  useRemoveQuestionFromSubChapter,
} from "@/hooks/useQuestionSubChapters";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { useToast } from "@/contexts/ToastContext";

export default function AssignQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const tryoutId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const subChapterId = Array.isArray(params?.subChapterId)
    ? params.subChapterId[0]
    : params?.subChapterId;

  const { data: tryout } = useTryout(tryoutId);
  const { data: subChapters = [] } = useSubChapters(tryoutId);
  const subChapter = subChapters.find((sc) => sc.id === subChapterId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningQuestionIds, setAssigningQuestionIds] = useState(new Set());
  const [removingQuestionIds, setRemovingQuestionIds] = useState(new Set());
  const hasAutoFiltered = useRef(false);

  // Auto-filter kategori berdasarkan sub-chapter (hanya sekali saat initial load)
  useEffect(() => {
    if (subChapter?.categoryId && !hasAutoFiltered.current && !selectedCategoryId) {
      setSelectedCategoryId(subChapter.categoryId);
      hasAutoFiltered.current = true;
    }
  }, [subChapter?.categoryId, selectedCategoryId]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryId, itemsPerPage]);

  const offset = (currentPage - 1) * itemsPerPage;
  const { data: poolData, isLoading: poolLoading } = useQuestionsPool(
    searchQuery,
    itemsPerPage,
    offset,
    selectedCategoryId || null
  );

  const questionsPool = poolData?.questions || [];
  const totalQuestions = poolData?.total || 0;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);

  const { data: assignedQuestions = [], isLoading: assignedLoading } =
    useSubChapterQuestions(tryoutId, subChapterId);
  const assignQuestion = useAssignQuestionToSubChapter();
  const removeQuestion = useRemoveQuestionFromSubChapter();
  const createQuestion = useCreateQuestionPool();
  const { showToast } = useToast();

  // Get set of assigned question IDs for quick lookup
  const assignedQuestionIds = new Set(assignedQuestions.map((q) => q.id));
  // Map question ID to questionSubChapterId untuk unassign
  const questionSubChapterIdMap = new Map(
    assignedQuestions.map((q) => [q.id, q.questionSubChapterId])
  );

  async function handleAssignQuestion(questionId) {
    // Add to loading set
    setAssigningQuestionIds((prev) => new Set(prev).add(questionId));
    try {
      await assignQuestion.mutateAsync({
        tryoutId,
        subChapterId,
        data: { questionId },
      });
      showToast("Soal berhasil ditambahkan ke sub-bab!", "success");
    } catch (error) {
      showToast(`Gagal menambahkan: ${error.message}`, "error");
    } finally {
      // Remove from loading set
      setAssigningQuestionIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function handleUnassignQuestion(questionId) {
    const questionSubChapterId = questionSubChapterIdMap.get(questionId);
    if (!questionSubChapterId) {
      showToast("ID relasi tidak ditemukan", "error");
      return;
    }

    // Add to loading set
    setRemovingQuestionIds((prev) => new Set(prev).add(questionId));
    try {
      await removeQuestion.mutateAsync({
        tryoutId,
        subChapterId,
        questionSubChapterId,
      });
      showToast("Soal berhasil dihapus dari sub-bab!", "success");
    } catch (error) {
      showToast(`Gagal menghapus: ${error.message}`, "error");
    } finally {
      // Remove from loading set
      setRemovingQuestionIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function handleCreateAndAssign(data) {
    try {
      // Create question first
      const newQuestion = await createQuestion.mutateAsync(data);
      // Then assign to sub-chapter
      await assignQuestion.mutateAsync({
        tryoutId,
        subChapterId,
        data: { questionId: newQuestion.id },
      });
      showToast("Soal berhasil dibuat dan ditambahkan ke sub-bab!", "success");
      // Tutup form dan kembali ke pool view
      setShowCreateForm(false);
    } catch (error) {
      showToast(`Gagal membuat soal: ${error.message}`, "error");
    }
  }

  if (!tryout || !subChapter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat...</p>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">
          Assign Soal ke Sub-Bab
        </h1>
        <p className="text-gray-600 mt-2">
          Pilih soal dari pool atau buat soal baru untuk sub-bab:{" "}
          <strong>{subChapter.categoryName || subChapter.name || "Sub-Bab"}</strong>
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          variant={showCreateForm ? "secondary" : "primary"}
          onClick={() => setShowCreateForm(false)}
        >
          Pilih dari Pool
        </Button>
        <Button
          variant={showCreateForm ? "primary" : "secondary"}
          onClick={() => setShowCreateForm(true)}
        >
          Buat Soal Baru
        </Button>
      </div>

      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Buat Soal Baru</CardTitle>
            <CardDescription>
              Soal yang dibuat akan otomatis ditambahkan ke sub-bab ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionForm
              onSubmit={handleCreateAndAssign}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createQuestion.isPending || assignQuestion.isPending}
              submitLabel="Buat & Assign"
              defaultCategoryId={subChapter.categoryId} // Auto-fill category dari sub-chapter
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pool Soal (Reusable)</CardTitle>
            <CardDescription>
              Pilih soal yang sudah ada untuk ditambahkan ke sub-bab ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                label="Cari Soal"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan teks soal..."
              />
              <Select
                label="Filter Kategori"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                options={[
                  { value: "", label: "Semua Kategori" },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
                placeholder="Pilih kategori..."
                disabled={categoriesLoading}
              />
              <Select
                label="Tampilkan per Halaman"
                value={String(itemsPerPage)}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                options={[
                  { value: "10", label: "10 soal" },
                  { value: "20", label: "20 soal" },
                  { value: "25", label: "25 soal" },
                ]}
              />
            </div>

            {poolLoading || assignedLoading ? (
              <p className="text-gray-600">Memuat pool soal...</p>
            ) : questionsPool.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedCategoryId
                    ? `Tidak ada soal yang cocok${selectedCategoryId ? ` dengan kategori yang dipilih` : ""}${searchQuery ? ` dan pencarian "${searchQuery}"` : ""}`
                    : "Belum ada soal di pool. Buat soal baru terlebih dahulu."}
                </p>
                <div className="flex gap-2 justify-center">
                  {(searchQuery || selectedCategoryId) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategoryId("");
                      }}
                    >
                      Reset Filter
                    </Button>
                  )}
                  <Button onClick={() => setShowCreateForm(true)}>
                    Buat Soal Baru
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {questionsPool.map((question) => {
                    const isAssigned = assignedQuestionIds.has(question.id);
                    const isAssigning = assigningQuestionIds.has(question.id);
                    const isRemoving = removingQuestionIds.has(question.id);
                    const isLoading = isAssigning || isRemoving;

                    return (
                      <div
                        key={question.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isAssigned
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-sm text-gray-900 flex-1">
                                {question.text}
                              </p>
                              {isAssigned && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Sudah di-assign
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {question.categoryName && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                  {question.categoryName}
                                </span>
                              )}
                              <span>
                                {question.answerOptions?.length || 0} opsi jawaban
                              </span>
                              {question.correctAnswerOptionId && (
                                <span className="text-green-600">
                                  ✓ Jawaban benar sudah ditetapkan
                                </span>
                              )}
                              {question.explanation && (
                                <span>📝 Ada penjelasan</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isAssigned ? (
                              <Button
                                variant="danger"
                                className="text-xs"
                                onClick={() => handleUnassignQuestion(question.id)}
                                disabled={isLoading}
                              >
                                {isRemoving ? (
                                  <span className="flex items-center gap-1">
                                    <span className="inline-block w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></span>
                                    Menghapus...
                                  </span>
                                ) : (
                                  "✕ Unassign"
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                className="text-xs"
                                onClick={() => handleAssignQuestion(question.id)}
                                disabled={isLoading}
                              >
                                {isAssigning ? (
                                  <span className="flex items-center gap-1">
                                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Menambahkan...
                                  </span>
                                ) : (
                                  "+ Assign"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalQuestions}
                    itemsPerPage={itemsPerPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

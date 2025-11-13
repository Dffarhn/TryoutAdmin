"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useTryout, useUpdateTryout } from "@/hooks/useTryouts";
import {
  useSubChapters,
  useCreateSubChapter,
  useUpdateSubChapter,
  useDeleteSubChapter,
} from "@/hooks/useSubChapters";
import { useSubChapterQuestions } from "@/hooks/useQuestionSubChapters";
import { useCreateCategory } from "@/hooks/useCategories";
import { TryoutForm } from "@/components/admin/TryoutForm";
import { SubChapterForm } from "@/components/admin/SubChapterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { BookOpen } from "lucide-react";

// Component untuk menampilkan row sub-chapter dengan count soal
function SubChapterRow({ tryoutId, subChapter, onEdit, onDelete, isDeleting }) {
  const { data: questions = [], isLoading: questionsLoading } =
    useSubChapterQuestions(tryoutId, subChapter.id);

  return (
    <TableRow>
      <TableCell className="font-medium">{subChapter.orderIndex}</TableCell>
      <TableCell className="font-medium">{subChapter.categoryName || "-"}</TableCell>
      <TableCell>
        {questionsLoading ? (
          <span className="text-sm text-gray-400">...</span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {questions.length} soal
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/tryouts/${tryoutId}/sub-chapters/${subChapter.id}/questions/assign`}
          >
            <Button
              variant="secondary"
              className="text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Kelola Soal
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="text-xs px-3 py-1.5"
            onClick={() => onEdit(subChapter)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            className="text-xs px-3 py-1.5"
            onClick={() => onDelete(subChapter.id, subChapter.categoryName || "Sub-Bab")}
            disabled={isDeleting}
          >
            Hapus
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function EditTryoutPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: tryout, isLoading } = useTryout(id);
  const updateTryout = useUpdateTryout();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  // Sub-chapters state
  const { data: subChapters = [], isLoading: subChaptersLoading } =
    useSubChapters(id);
  const createSubChapter = useCreateSubChapter();
  const updateSubChapter = useUpdateSubChapter();
  const deleteSubChapter = useDeleteSubChapter();
  const createCategory = useCreateCategory();
  const [editingSubChapter, setEditingSubChapter] = useState(null);
  const [showSubChapterForm, setShowSubChapterForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTryoutForm, setShowTryoutForm] = useState(false);
  const [sortColumn, setSortColumn] = useState(null); // 'orderIndex', 'name', 'categoryName', 'questionCount'
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' or 'desc'

  async function handleSubmit(data) {
    try {
      await updateTryout.mutateAsync({ id, data });
      showToast("Berhasil disimpan!", "success");
      setIsEditMode(false);
      setShowTryoutForm(false);
    } catch (error) {
      showToast(`Gagal menyimpan: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/tryouts");
  }

  // Sub-chapter handlers
  async function handleSubChapterSubmit(data) {
    try {
      let finalData = { ...data };
      
      // If new category is provided, create it first
      if (data.newCategory && !editingSubChapter) {
        const newCategory = await createCategory.mutateAsync({
          name: data.newCategory.name,
          description: data.newCategory.description,
        });
        finalData.categoryId = newCategory.id;
        delete finalData.newCategory;
      }

      if (editingSubChapter) {
        // Remove newCategory from data when editing (shouldn't happen, but just in case)
        delete finalData.newCategory;
        await updateSubChapter.mutateAsync({
          tryoutId: id,
          subChapterId: editingSubChapter.id,
          data: finalData,
        });
      } else {
        await createSubChapter.mutateAsync({ tryoutId: id, data: finalData });
      }
      setShowSubChapterForm(false);
      setEditingSubChapter(null);
      showToast(
        editingSubChapter
          ? "Sub-bab berhasil diupdate!"
          : "Sub-bab berhasil ditambahkan!",
        "success"
      );
    } catch (error) {
      showToast(`Gagal menyimpan: ${error.message}`, "error");
    }
  }

  function handleEditSubChapter(subChapter) {
    setEditingSubChapter(subChapter);
    setShowSubChapterForm(true);
  }

  function handleCancelSubChapter() {
    setShowSubChapterForm(false);
    setEditingSubChapter(null);
  }

  async function handleDeleteSubChapter(subChapterId, name) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Sub-Bab",
      description: `Apakah Anda yakin ingin menghapus sub-bab "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteSubChapter.mutateAsync({ tryoutId: id, subChapterId });
      showToast("Sub-bab berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus: ${error.message}`, "error");
    }
  }

  // Sorting handler
  function handleSort(column) {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Sorted sub-chapters
  const sortedSubChapters = useMemo(() => {
    if (!sortColumn) return subChapters;

    const sorted = [...subChapters];
    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case "orderIndex":
          aValue = a.orderIndex ?? 0;
          bValue = b.orderIndex ?? 0;
          break;
        case "categoryName":
          aValue = (a.categoryName || "").toLowerCase();
          bValue = (b.categoryName || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [subChapters, sortColumn, sortDirection]);

  // Sortable table head component
  function SortableTableHead({ column, children }) {
    const isActive = sortColumn === column;
    return (
      <TableHead>
        <button
          onClick={() => handleSort(column)}
          className="flex items-center gap-2 hover:text-gray-900 transition-colors w-full text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
        >
          {children}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-50" />
          )}
        </button>
      </TableHead>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat tryout...</p>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Edit Tryout" : "Detail Tryout"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode
              ? "Perbarui data tryout lalu simpan"
              : "Lihat detail tryout dan kelola sub-bab"}
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditMode && (
            <Button onClick={() => setIsEditMode(true)}>Edit Tryout</Button>
          )}
          <Link href={`/admin/tryouts/${id}/questions`}>
            <Button variant="secondary">Kelola Soal</Button>
          </Link>
        </div>
      </div>

      {isEditMode ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Tryout</CardTitle>
                <CardDescription>
                  Edit informasi tryout di bawah ini
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditMode(false);
                  setShowTryoutForm(false);
                }}
              >
                Batal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TryoutForm
              initialData={tryout}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsEditMode(false);
                setShowTryoutForm(false);
              }}
              isLoading={updateTryout.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Data Tryout</CardTitle>
                <CardDescription>Informasi tryout</CardDescription>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsEditMode(true)}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Judul
                </label>
                <p className="text-gray-900 mt-1">{tryout.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Paket
                </label>
                <p className="text-gray-900 mt-1">{tryout.packageName || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Durasi
                </label>
                <p className="text-gray-900 mt-1">
                  {tryout.durationMinutes} menit
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <p className="text-gray-900 mt-1">
                  {tryout.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      Nonaktif
                    </span>
                  )}
                </p>
              </div>
              {tryout.description && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <p className="text-gray-900 mt-1">{tryout.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sub-Bab</CardTitle>
              <CardDescription>
                Kelola sub-bab untuk tryout ini ({subChapters.length} sub-bab)
              </CardDescription>
            </div>
            {!showSubChapterForm && (
              <Button
                onClick={() => {
                  setEditingSubChapter(null);
                  setShowSubChapterForm(true);
                }}
              >
                + Tambah Sub-Bab
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showSubChapterForm ? (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">
                {editingSubChapter ? "Edit Sub-Bab" : "Tambah Sub-Bab Baru"}
              </h3>
              <SubChapterForm
                initialData={editingSubChapter}
                onSubmit={handleSubChapterSubmit}
                onCancel={handleCancelSubChapter}
                isLoading={
                  createSubChapter.isPending ||
                  updateSubChapter.isPending ||
                  createCategory.isPending
                }
                submitLabel={editingSubChapter ? "Update" : "Simpan"}
                existingSubChapters={subChapters}
              />
            </div>
          ) : null}

          {subChaptersLoading ? (
            <p className="text-gray-600">Memuat sub-bab...</p>
          ) : subChapters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Belum ada sub-bab</p>
              <Button onClick={() => setShowSubChapterForm(true)}>
                Tambah Sub-Bab Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <SortableTableHead column="orderIndex">Urutan</SortableTableHead>
                  <SortableTableHead column="categoryName">Kategori</SortableTableHead>
                  <TableHead>Jumlah Soal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                  <TableBody>
                  {sortedSubChapters.map((subChapter) => (
                    <SubChapterRow
                      key={subChapter.id}
                      tryoutId={id}
                      subChapter={subChapter}
                      onEdit={handleEditSubChapter}
                      onDelete={handleDeleteSubChapter}
                      isDeleting={deleteSubChapter.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

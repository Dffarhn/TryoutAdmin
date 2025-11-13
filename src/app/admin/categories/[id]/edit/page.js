"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useCategory, useUpdateCategory } from "@/hooks/useCategories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: category, isLoading } = useCategory(id);
  const updateCategory = useUpdateCategory();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await updateCategory.mutateAsync({ id, data });
      showToast("Kategori berhasil disimpan", "success");
    } catch (error) {
      showToast(`Gagal menyimpan kategori: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/categories");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat kategori...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">Kategori tidak ditemukan</p>
        <Link href="/admin/categories">
          <Button>Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Kategori</h1>
        <p className="text-gray-600 mt-2">Perbarui data kategori lalu simpan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Kategori</CardTitle>
          <CardDescription>
            Edit informasi kategori di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            initialData={category}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateCategory.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}


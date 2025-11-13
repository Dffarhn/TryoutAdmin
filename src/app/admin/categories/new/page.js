"use client";

import { useRouter } from "next/navigation";
import { useCreateCategory } from "@/hooks/useCategories";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewCategoryPage() {
  const router = useRouter();
  const createCategory = useCreateCategory();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createCategory.mutateAsync(data);
      router.push("/admin/categories");
    } catch (error) {
      showToast(`Gagal menyimpan kategori: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/categories");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Kategori</h1>
        <p className="text-gray-600 mt-2">Isi data kategori kemudian simpan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Kategori</CardTitle>
          <CardDescription>
            Lengkapi informasi kategori di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createCategory.isPending}
            submitLabel="Simpan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


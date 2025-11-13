"use client";

import Link from "next/link";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  async function handleDelete(id, name) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Kategori",
      description: `Apakah Anda yakin ingin menghapus kategori "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteCategory.mutateAsync(id);
      showToast("Kategori berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus kategori: ${error.message}`, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat kategori...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategori</h1>
          <p className="text-gray-600 mt-2">
            Kelola kategori mata pelajaran ({categories.length} kategori)
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>+ Kategori Baru</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>
            {categories.length === 0
              ? "Belum ada kategori. Tambah kategori pertama."
              : `${categories.length} kategori tersedia`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada kategori</p>
              <Link href="/admin/categories/new">
                <Button>Tambah Kategori Pertama</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {category.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/categories/${category.id}/edit`}
                          >
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() =>
                              handleDelete(category.id, category.name)
                            }
                            disabled={deleteCategory.isPending}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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


"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePackage } from "@/hooks/usePackages";
import { useTryoutsByPackage, useDeleteTryout } from "@/hooks/useTryouts";
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

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: pkg, isLoading: packageLoading } = usePackage(id);
  const { data: tryouts = [], isLoading: tryoutsLoading } =
    useTryoutsByPackage(id);
  const deleteTryout = useDeleteTryout();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  async function handleDeleteTryout(tryoutId, title) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Tryout",
      description: `Apakah Anda yakin ingin menghapus tryout "${title}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteTryout.mutateAsync(tryoutId);
      showToast("Tryout berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus tryout: ${error.message}`, "error");
    }
  }

  if (packageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat paket...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">Paket tidak ditemukan</p>
        <Link href="/admin/packages">
          <Button>Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/packages"
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
          Kembali ke Daftar Paket
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{pkg.name}</h1>
            <p className="text-gray-600 mt-2">Detail paket dan daftar tryouts</p>
          </div>
          <Link href={`/admin/packages/${id}/edit`}>
            <Button variant="primary">Edit Paket</Button>
          </Link>
        </div>
      </div>

      {/* Informasi Paket */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informasi Paket</CardTitle>
          <CardDescription>Detail informasi paket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nama</label>
              <p className="text-gray-900 mt-1">{pkg.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pkg.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {pkg.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <p className="text-gray-900 mt-1">{pkg.description || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tanggal Dibuat
              </label>
              <p className="text-gray-900 mt-1">
                {pkg.createdAt
                  ? new Date(pkg.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tanggal Diupdate
              </label>
              <p className="text-gray-900 mt-1">
                {pkg.updatedAt
                  ? new Date(pkg.updatedAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daftar Tryouts */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tryouts</CardTitle>
          <CardDescription>
            {tryoutsLoading
              ? "Memuat tryouts..."
              : `${tryouts.length} tryout menggunakan paket ini`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tryoutsLoading ? (
            <p className="text-gray-600 text-center py-8">Memuat tryouts...</p>
          ) : tryouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Belum ada tryout yang menggunakan paket ini
              </p>
              <Link href="/admin/tryouts/new">
                <Button>Buat Tryout Baru</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Judul</TableHead>
                  <TableHead>Durasi (mnt)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {tryouts.map((tryout) => (
                    <TableRow key={tryout.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/tryouts/${tryout.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {tryout.title}
                        </Link>
                      </TableCell>
                      <TableCell>{tryout.durationMinutes}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tryout.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tryout.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/tryouts/${tryout.id}/edit`}>
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Link href={`/admin/tryouts/${tryout.id}/questions`}>
                            <Button variant="ghost" className="text-xs px-3 py-1.5">
                              Soal
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() =>
                              handleDeleteTryout(tryout.id, tryout.title)
                            }
                            disabled={deleteTryout.isPending}
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


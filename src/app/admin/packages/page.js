"use client";

import { useState } from "react";
import Link from "next/link";
import { usePackages, useDeletePackage, useUpdatePackage } from "@/hooks/usePackages";
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

export default function PackagesPage() {
  const [filterActive, setFilterActive] = useState(null); // null = all, true = active, false = inactive
  const { data: packages = [], isLoading } = usePackages(filterActive);
  const deletePackage = useDeletePackage();
  const updatePackage = useUpdatePackage();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  async function handleDelete(id, name) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Paket",
      description: `Apakah Anda yakin ingin menghapus paket "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deletePackage.mutateAsync(id);
      showToast("Paket berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus paket: ${error.message}`, "error");
    }
  }

  async function handleToggleActive(id, currentStatus, name) {
    try {
      await updatePackage.mutateAsync({
        id,
        data: { isActive: !currentStatus },
      });
      showToast(`Paket berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`, "success");
    } catch (error) {
      showToast(`Gagal mengupdate paket: ${error.message}`, "error");
    }
  }

  const activeCount = packages.filter((p) => p.isActive).length;
  const inactiveCount = packages.filter((p) => !p.isActive).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat paket...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paket</h1>
          <p className="text-gray-600 mt-2">
            Kelola paket tryout ({activeCount} aktif, {inactiveCount} nonaktif)
          </p>
        </div>
        <Link href="/admin/packages/new">
          <Button>+ Paket Baru</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>
                {packages.length === 0
                  ? "Belum ada paket. Tambah paket pertama."
                  : `${packages.length} paket tersedia`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === null ? "primary" : "secondary"}
                onClick={() => setFilterActive(null)}
                className="text-xs"
              >
                Semua
              </Button>
              <Button
                variant={filterActive === true ? "primary" : "secondary"}
                onClick={() => setFilterActive(true)}
                className="text-xs"
              >
                Aktif
              </Button>
              <Button
                variant={filterActive === false ? "primary" : "secondary"}
                onClick={() => setFilterActive(false)}
                className="text-xs"
              >
                Nonaktif
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada paket</p>
              <Link href="/admin/packages/new">
                <Button>Tambah Paket Pertama</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/packages/${pkg.id}`}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {pkg.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {pkg.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pkg.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {pkg.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/packages/${pkg.id}/edit`}>
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            className="text-xs px-3 py-1.5"
                            onClick={() =>
                              handleToggleActive(pkg.id, pkg.isActive, pkg.name)
                            }
                            disabled={updatePackage.isPending}
                          >
                            {pkg.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                            disabled={deletePackage.isPending}
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


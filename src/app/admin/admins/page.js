"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdmins, useDeleteAdmin } from "@/hooks/useAdmins";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { UserPlus, Search } from "lucide-react";

export default function AdminsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: admins = [], isLoading } = useAdmins();
  const deleteAdmin = useDeleteAdmin();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const query = searchQuery.toLowerCase();
    return admins.filter(
      (admin) =>
        admin.username?.toLowerCase().includes(query) ||
        admin.fullName?.toLowerCase().includes(query) ||
        admin.email?.toLowerCase().includes(query)
    );
  }, [admins, searchQuery]);

  async function handleDelete(id, username) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Admin",
      description: `Apakah Anda yakin ingin menghapus admin "${username}"? Admin yang dihapus akan dinonaktifkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteAdmin.mutateAsync(id);
      showToast("Admin berhasil dihapus", "success");
    } catch (error) {
      showToast(error.message || "Gagal menghapus admin", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat daftar admin...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Admin</h1>
          <p className="text-gray-600 mt-2">Kelola akun administrator</p>
        </div>
        <Link href="/admin/admins/new">
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Tambah Admin
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Admin</CardTitle>
          <CardDescription>
            {filteredAdmins.length} admin ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari admin..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "Tidak ada admin yang cocok dengan pencarian"
                  : "Belum ada admin. Tambah admin pertama"}
              </p>
              {!searchQuery && (
                <Link href="/admin/admins/new">
                  <Button>Tambah Admin</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.username}
                      </TableCell>
                      <TableCell>{admin.fullName || "-"}</TableCell>
                      <TableCell>{admin.email || "-"}</TableCell>
                      <TableCell>
                        {admin.isSuperAdmin ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            Super Admin
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            admin.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {admin.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {admin.lastLoginAt
                          ? new Date(admin.lastLoginAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Belum pernah login"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/admins/${admin.id}/edit`}>
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleDelete(admin.id, admin.username)}
                            disabled={deleteAdmin.isPending}
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


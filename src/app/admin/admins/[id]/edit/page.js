"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdmin, useUpdateAdmin, useDeleteAdmin } from "@/hooks/useAdmins";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AdminForm } from "@/components/admin/AdminForm";

export default function EditAdminPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { data: admin, isLoading: adminLoading } = useAdmin(adminId);
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  async function handleSubmit(data) {
    try {
      await updateAdmin.mutateAsync({ id: adminId, data });
      showToast("Admin berhasil diupdate", "success");
      router.push("/admin/admins");
    } catch (error) {
      showToast(error.message || "Gagal mengupdate admin", "error");
    }
  }

  async function handleDelete() {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Admin",
      description: `Apakah Anda yakin ingin menghapus admin "${admin?.username}"? Admin yang dihapus akan dinonaktifkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteAdmin.mutateAsync(adminId);
      showToast("Admin berhasil dihapus", "success");
      router.push("/admin/admins");
    } catch (error) {
      showToast(error.message || "Gagal menghapus admin", "error");
    }
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data admin...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Admin tidak ditemukan</p>
          <Button onClick={() => router.push("/admin/admins")}>
            Kembali ke Daftar Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Admin</h1>
        <p className="text-gray-600 mt-2">Ubah informasi admin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Admin</CardTitle>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteAdmin.isPending}
            >
              {deleteAdmin.isPending ? "Menghapus..." : "Hapus Admin"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AdminForm
            mode="edit"
            initialData={admin}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/admins")}
            isLoading={updateAdmin.isPending}
            submitLabel="Simpan Perubahan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


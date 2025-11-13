"use client";

import { useRouter } from "next/navigation";
import { useCreateAdmin } from "@/hooks/useAdmins";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";

export default function NewAdminPage() {
  const router = useRouter();
  const createAdmin = useCreateAdmin();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createAdmin.mutateAsync(data);
      showToast("Admin berhasil dibuat", "success");
      router.push("/admin/admins");
    } catch (error) {
      console.error("Create admin error:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Gagal membuat admin";
      showToast(errorMessage, "error");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Admin Baru</h1>
        <p className="text-gray-600 mt-2">Buat akun administrator baru</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/admins")}
            isLoading={createAdmin.isPending}
            submitLabel="Buat Admin"
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { usePackage, useUpdatePackage } from "@/hooks/usePackages";
import { PackageForm } from "@/components/admin/PackageForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data: pkg, isLoading } = usePackage(id);
  const updatePackage = useUpdatePackage();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await updatePackage.mutateAsync({ id, data });
      showToast("Paket berhasil disimpan", "success");
    } catch (error) {
      showToast(`Gagal menyimpan paket: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/packages");
  }

  if (isLoading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Paket</h1>
        <p className="text-gray-600 mt-2">Perbarui data paket lalu simpan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Paket</CardTitle>
          <CardDescription>
            Edit informasi paket di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PackageForm
            initialData={pkg}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updatePackage.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}


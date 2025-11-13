"use client";

import { useRouter } from "next/navigation";
import { useCreatePackage } from "@/hooks/usePackages";
import { PackageForm } from "@/components/admin/PackageForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewPackagePage() {
  const router = useRouter();
  const createPackage = useCreatePackage();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createPackage.mutateAsync(data);
      router.push("/admin/packages");
    } catch (error) {
      showToast(`Gagal menyimpan paket: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/packages");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Paket</h1>
        <p className="text-gray-600 mt-2">Isi data paket kemudian simpan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Paket</CardTitle>
          <CardDescription>
            Lengkapi informasi paket di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PackageForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createPackage.isPending}
            submitLabel="Simpan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


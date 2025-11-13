"use client";

import { useRouter } from "next/navigation";
import { useCreateTryoutSession } from "@/hooks/useTryoutSessions";
import { TryoutSessionBulkForm } from "@/components/admin/TryoutSessionBulkForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewTryoutSessionPage() {
  const router = useRouter();
  const createTryoutSession = useCreateTryoutSession();
  const { showToast } = useToast();

  async function handleSubmit(dataArray) {
    try {
      // API supports both single and array, so we pass array directly
      await createTryoutSession.mutateAsync(dataArray);
      router.push("/admin/tryout-sessions");
    } catch (error) {
      showToast(`Gagal menyimpan hubungan paket: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/tryout-sessions");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Hubungan Paket & Tipe Langganan</h1>
        <p className="text-gray-600 mt-2">
          Tentukan paket tryout yang dapat diakses oleh pengguna berdasarkan tipe langganan mereka. Anda dapat menambahkan beberapa paket sekaligus untuk efisiensi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Hubungan Paket</CardTitle>
          <CardDescription>
            Pilih tipe langganan terlebih dahulu, kemudian tambahkan paket tryout yang akan tersedia untuk tipe langganan tersebut. Gunakan fitur drag & drop untuk kemudahan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TryoutSessionBulkForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createTryoutSession.isPending}
            submitLabel="Simpan Semua"
          />
        </CardContent>
      </Card>
    </div>
  );
}


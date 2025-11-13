"use client";

import { useRouter } from "next/navigation";
import { useCreateTryout } from "@/hooks/useTryouts";
import { TryoutForm } from "@/components/admin/TryoutForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewTryoutPage() {
  const router = useRouter();
  const createTryout = useCreateTryout();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      const result = await createTryout.mutateAsync(data);
      router.push(`/admin/tryouts/${result.id}/edit`);
    } catch (error) {
      showToast(`Gagal menyimpan tryout: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/tryouts");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Tryout</h1>
        <p className="text-gray-600 mt-2">Isi data tryout kemudian simpan</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Tryout</CardTitle>
          <CardDescription>
            Lengkapi informasi tryout di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TryoutForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createTryout.isPending}
            submitLabel="Simpan & Edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCreateSubscriptionType } from "@/hooks/useSubscriptionTypes";
import { SubscriptionTypeForm } from "@/components/admin/SubscriptionTypeForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewSubscriptionTypePage() {
  const router = useRouter();
  const createSubscriptionType = useCreateSubscriptionType();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createSubscriptionType.mutateAsync(data);
      router.push("/admin/subscription-types");
    } catch (error) {
      showToast(`Gagal menyimpan tipe langganan: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/subscription-types");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Tipe Langganan</h1>
        <p className="text-gray-600 mt-2">Buat tipe langganan baru dengan mengisi informasi di bawah ini</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Tipe Langganan</CardTitle>
          <CardDescription>
            Isi semua field yang diperlukan untuk membuat tipe langganan baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionTypeForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createSubscriptionType.isPending}
            submitLabel="Simpan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useRouter, useParams } from "next/navigation";
import { useSubscriptionType, useUpdateSubscriptionType } from "@/hooks/useSubscriptionTypes";
import { SubscriptionTypeForm } from "@/components/admin/SubscriptionTypeForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function EditSubscriptionTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { data: subscriptionType, isLoading } = useSubscriptionType(id);
  const updateSubscriptionType = useUpdateSubscriptionType();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await updateSubscriptionType.mutateAsync({ id, data });
      router.push("/admin/subscription-types");
    } catch (error) {
      showToast(`Gagal memperbarui tipe langganan: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/subscription-types");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data tipe langganan...</p>
      </div>
    );
  }

  if (!subscriptionType) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Tipe langganan tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Tipe Langganan</h1>
        <p className="text-gray-600 mt-2">Perbarui informasi tipe langganan dengan mengisi form di bawah ini</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Tipe Langganan</CardTitle>
          <CardDescription>
            Edit informasi tipe langganan di bawah ini sesuai kebutuhan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionTypeForm
            initialData={subscriptionType}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateSubscriptionType.isPending}
            submitLabel="Update"
          />
        </CardContent>
      </Card>
    </div>
  );
}


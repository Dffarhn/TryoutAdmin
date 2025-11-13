"use client";

import { useRouter, useParams } from "next/navigation";
import { useTransaction, useUpdateTransaction } from "@/hooks/useTransactions";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { data: transaction, isLoading } = useTransaction(id);
  const updateTransaction = useUpdateTransaction();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await updateTransaction.mutateAsync({ id, data });
      router.push("/admin/transactions");
    } catch (error) {
      showToast(`Gagal memperbarui transaksi: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/transactions");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data transaksi...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Transaksi tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Transaksi Pembayaran</h1>
        <p className="text-gray-600 mt-2">Perbarui status pembayaran transaksi. Ketika status diubah menjadi 'Lunas', langganan pengguna akan otomatis dibuat atau diperbarui.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
          <CardDescription>
            Perbarui status pembayaran di bawah ini. Ubah status menjadi 'Lunas' untuk membuat atau memperbarui langganan pengguna secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            initialData={transaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateTransaction.isPending}
            submitLabel="Update"
          />
        </CardContent>
      </Card>
    </div>
  );
}


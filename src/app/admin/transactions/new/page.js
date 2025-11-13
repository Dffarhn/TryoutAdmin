"use client";

import { useRouter } from "next/navigation";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useToast } from "@/contexts/ToastContext";

export default function NewTransactionPage() {
  const router = useRouter();
  const createTransaction = useCreateTransaction();
  const { showToast } = useToast();

  async function handleSubmit(data) {
    try {
      await createTransaction.mutateAsync(data);
      router.push("/admin/transactions");
    } catch (error) {
      showToast(`Gagal menyimpan transaksi: ${error.message}`, "error");
    }
  }

  function handleCancel() {
    router.push("/admin/transactions");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tambah Transaksi Pembayaran</h1>
        <p className="text-gray-600 mt-2">Buat transaksi pembayaran baru. Setelah status pembayaran diubah menjadi 'Lunas', langganan pengguna akan otomatis dibuat.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
          <CardDescription>
            Lengkapi informasi transaksi di bawah ini. Ketika status pembayaran diubah menjadi 'Lunas', sistem akan otomatis membuat atau memperbarui langganan pengguna.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createTransaction.isPending}
            submitLabel="Simpan"
          />
        </CardContent>
      </Card>
    </div>
  );
}


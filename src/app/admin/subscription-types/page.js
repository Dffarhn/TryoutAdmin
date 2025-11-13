"use client";

import Link from "next/link";
import { useSubscriptionTypes, useDeleteSubscriptionType } from "@/hooks/useSubscriptionTypes";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default function SubscriptionTypesPage() {
  const { data: subscriptionTypes = [], isLoading } = useSubscriptionTypes();
  const deleteSubscriptionType = useDeleteSubscriptionType();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  async function handleDelete(id, name) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Tipe Langganan",
      description: `Apakah Anda yakin ingin menghapus tipe langganan "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteSubscriptionType.mutateAsync(id);
      showToast("Tipe langganan berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus tipe langganan: ${error.message}`, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data tipe langganan...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipe Langganan</h1>
          <p className="text-gray-600 mt-2">
            Kelola paket langganan yang tersedia untuk pengguna ({subscriptionTypes.length} tipe)
          </p>
        </div>
        <Link href="/admin/subscription-types/new">
          <Button>+ Tipe Langganan Baru</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tipe Langganan</CardTitle>
          <CardDescription>
            {subscriptionTypes.length === 0
              ? "Belum ada tipe langganan yang terdaftar. Tambahkan tipe langganan pertama untuk memulai."
              : `${subscriptionTypes.length} tipe langganan tersedia`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada tipe langganan yang terdaftar</p>
              <Link href="/admin/subscription-types/new">
                <Button>Tambah Tipe Langganan Pertama</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Nama</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Durasi (Hari)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {subscriptionTypes.map((st) => (
                    <TableRow key={st.id}>
                      <TableCell className="font-medium">
                        {st.name}
                      </TableCell>
                      <TableCell>
                        Rp {st.price.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {st.durationDays} hari
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          st.isActive 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {st.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/subscription-types/${st.id}/edit`}
                          >
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() =>
                              handleDelete(st.id, st.name)
                            }
                            disabled={deleteSubscriptionType.isPending}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


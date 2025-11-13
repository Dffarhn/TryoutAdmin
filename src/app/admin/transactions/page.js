"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Trash2, Receipt, DollarSign, Clock, CheckCircle, XCircle, Ban } from "lucide-react";
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

export default function TransactionsPage() {
  const [filters, setFilters] = useState({
    paymentStatus: "",
  });
  const { data: transactions = [], isLoading } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  function getPaymentStatusLabel(status) {
    const labels = {
      pending: "Menunggu Pembayaran",
      paid: "Lunas",
      failed: "Gagal",
      cancelled: "Dibatalkan",
    };
    return labels[status] || status;
  }

  function getPaymentStatusColor(status) {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  async function handleDelete(id, userName, amount) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Transaksi",
      description: `Apakah Anda yakin ingin menghapus transaksi untuk ${userName} sebesar Rp ${amount.toLocaleString("id-ID")}? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteTransaction.mutateAsync(id);
      showToast("Transaksi berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus transaksi: ${error.message}`, "error");
    }
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = transactions.length;
    const totalRevenue = transactions
      .filter((t) => t.paymentStatus === "paid")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const pending = transactions.filter((t) => t.paymentStatus === "pending").length;
    const paid = transactions.filter((t) => t.paymentStatus === "paid").length;
    const failed = transactions.filter((t) => t.paymentStatus === "failed").length;
    const cancelled = transactions.filter((t) => t.paymentStatus === "cancelled").length;

    return {
      total,
      totalRevenue,
      pending,
      paid,
      failed,
      cancelled,
    };
  }, [transactions]);

  // Stat Card Component
  function StatCard({ title, value, icon: Icon, color = "gray", suffix = "" }) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {Icon && (
            <Icon
              className={`w-4 h-4 ${
                color === "green"
                  ? "text-green-600"
                  : color === "blue"
                  ? "text-blue-600"
                  : color === "orange"
                  ? "text-orange-600"
                  : color === "yellow"
                  ? "text-yellow-600"
                  : color === "red"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            />
          )}
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold ${
              color === "green"
                ? "text-green-600"
                : color === "blue"
                ? "text-blue-600"
                : color === "orange"
                ? "text-orange-600"
                : color === "yellow"
                ? "text-yellow-600"
                : color === "red"
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {typeof value === "number" && suffix === "currency"
              ? `Rp ${value.toLocaleString("id-ID")}`
              : value}
            {suffix && suffix !== "currency" && ` ${suffix}`}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data transaksi...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaksi Pembayaran</h1>
          <p className="text-gray-600 mt-2">
            Kelola dan pantau semua transaksi pembayaran langganan pengguna ({transactions.length} transaksi)
          </p>
        </div>
        <Link href="/admin/transactions/new">
          <Button>+ Transaksi Baru</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Total Transaksi"
          value={stats.total}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Total Pendapatan"
          value={stats.totalRevenue}
          icon={DollarSign}
          color="green"
          suffix="currency"
        />
        <StatCard
          title="Menunggu Pembayaran"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Lunas"
          value={stats.paid}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Gagal"
          value={stats.failed}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Dibatalkan"
          value={stats.cancelled}
          icon={Ban}
          color="gray"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status Pembayaran"
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              options={[
                { value: "", label: "Semua Status" },
                { value: "pending", label: "Menunggu Pembayaran" },
                { value: "paid", label: "Lunas" },
                { value: "failed", label: "Gagal" },
                { value: "cancelled", label: "Dibatalkan" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            {transactions.length === 0
              ? "Belum ada transaksi yang tercatat. Tambahkan transaksi pertama untuk memulai."
              : `${transactions.length} transaksi ditemukan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Belum ada transaksi yang tercatat</p>
              <Link href="/admin/transactions/new">
                <Button>Tambah Transaksi Pertama</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Tipe Langganan</TableHead>
                  <TableHead>Jumlah Pembayaran</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead>Tanggal Pembayaran</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.userName}
                      </TableCell>
                      <TableCell>
                        {transaction.subscriptionTypeName}
                      </TableCell>
                      <TableCell>
                        Rp {transaction.amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                          {getPaymentStatusLabel(transaction.paymentStatus)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.paidAt 
                          ? new Date(transaction.paidAt).toLocaleString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/transactions/${transaction.id}/edit`}
                          >
                            <Button variant="secondary" className="text-xs px-3 py-1.5">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs px-3 py-1.5"
                            onClick={() => handleDelete(transaction.id, transaction.userName, transaction.amount)}
                            disabled={deleteTransaction.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
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


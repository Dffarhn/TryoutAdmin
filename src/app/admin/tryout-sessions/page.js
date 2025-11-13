"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useTryoutSessions, useDeleteTryoutSession } from "@/hooks/useTryoutSessions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Trash2, Package, Calendar, CheckCircle2, XCircle } from "lucide-react";

export default function TryoutSessionsPage() {
  const [filters, setFilters] = useState({
    isActive: undefined,
  });
  const { data: sessions = [], isLoading } = useTryoutSessions(filters);
  const deleteTryoutSession = useDeleteTryoutSession();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  // Group sessions by subscription type
  const groupedSessions = useMemo(() => {
    const grouped = {};
    sessions.forEach((session) => {
      const key = session.subscriptionTypeId;
      if (!grouped[key]) {
        grouped[key] = {
          subscriptionTypeId: session.subscriptionTypeId,
          subscriptionTypeName: session.subscriptionTypeName,
          packages: [],
        };
      }
      grouped[key].packages.push(session);
    });
    return Object.values(grouped);
  }, [sessions]);

  async function handleDelete(id, packageName, subscriptionTypeName) {
    const confirmed = await showConfirm({
      title: "Konfirmasi Hapus Hubungan Paket",
      description: `Apakah Anda yakin ingin menghapus hubungan paket "${packageName}" dengan tipe langganan "${subscriptionTypeName}"? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
    });

    if (!confirmed) return;

    try {
      await deleteTryoutSession.mutateAsync(id);
      showToast("Hubungan paket berhasil dihapus", "success");
    } catch (error) {
      showToast(`Gagal menghapus hubungan paket: ${error.message}`, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data hubungan paket...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hubungan Paket & Tipe Langganan</h1>
          <p className="text-gray-600 mt-2">
            Kelola paket tryout yang dapat diakses berdasarkan tipe langganan pengguna ({sessions.length} hubungan)
          </p>
        </div>
        <Link href="/admin/tryout-sessions/new">
          <Button>+ Hubungan Baru</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={filters.isActive === undefined ? "" : filters.isActive ? "true" : "false"}
              onChange={(e) => setFilters({ 
                ...filters, 
                isActive: e.target.value === "" ? undefined : e.target.value === "true" 
              })}
              options={[
                { value: "", label: "Semua" },
                { value: "true", label: "Aktif" },
                { value: "false", label: "Tidak Aktif" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {groupedSessions.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Belum ada hubungan paket dengan tipe langganan</p>
                <Link href="/admin/tryout-sessions/new">
                  <Button>Tambah Hubungan Pertama</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          groupedSessions.map((group) => (
            <Card key={group.subscriptionTypeId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.subscriptionTypeName}</CardTitle>
                    <CardDescription className="mt-1">
                      {group.packages.length} paket terhubung
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    group.packages.some(p => p.isActive)
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {group.packages.some(p => p.isActive) ? "Memiliki Paket Aktif" : "Tidak Ada Paket Aktif"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.packages.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-gray-400" />
                          <h4 className="font-semibold text-gray-900">{session.packageName}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            session.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {session.isActive ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {session.isActive ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                        {session.availableUntil && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 ml-8">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Batas waktu akses: {new Date(session.availableUntil).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                        {!session.availableUntil && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 ml-8">
                            <Calendar className="w-4 h-4" />
                            <span>Akses tidak terbatas</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleDelete(session.id, session.packageName, session.subscriptionTypeName)
                        }
                        disabled={deleteTryoutSession.isPending}
                        className="ml-4"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


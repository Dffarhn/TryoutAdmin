"use client";

import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useSubscriptionTypes } from "@/hooks/useSubscriptionTypes";
import { useCreateUserSubscription, useUpdateUserSubscription } from "@/hooks/useUserSubscriptions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
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
import { Search, UserPlus, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useDialog } from "@/contexts/DialogContext";

export default function UserSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [selectedSubscriptionTypeId, setSelectedSubscriptionTypeId] = useState("");
  const [extendingSubscriptionId, setExtendingSubscriptionId] = useState(null);
  const [changingSubscriptionId, setChangingSubscriptionId] = useState(null);
  const [extendDays, setExtendDays] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const { data: users = [], isLoading } = useUsers({ search: searchQuery });
  const { data: subscriptionTypes = [] } = useSubscriptionTypes();
  const createSubscription = useCreateUserSubscription();
  const updateSubscription = useUpdateUserSubscription();
  const { showToast } = useToast();
  const { showConfirm } = useDialog();

  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);

  // Helper function to calculate remaining days
  function getRemainingDays(expiresAt) {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Helper function to format date
  function formatDate(dateString) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Helper function to get subscription status badge
  function getSubscriptionStatusBadge(subscription) {
    if (!subscription.isActive) {
      return { text: "Tidak Aktif", color: "bg-gray-100 text-gray-800" };
    }

    const remainingDays = getRemainingDays(subscription.expiresAt);
    if (remainingDays === null) {
      return { text: "Aktif", color: "bg-green-100 text-green-800" };
    }

    if (remainingDays < 0) {
      return { text: "Kadaluarsa", color: "bg-red-100 text-red-800" };
    } else if (remainingDays <= 7) {
      return { text: `Sisa ${remainingDays} hari`, color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: `Sisa ${remainingDays} hari`, color: "bg-green-100 text-green-800" };
    }
  }

  function handleStartAssign(userId) {
    setAssigningUserId(userId);
    setSelectedSubscriptionTypeId("");
  }

  function handleCancelAssign() {
    setAssigningUserId(null);
    setSelectedSubscriptionTypeId("");
  }

  function handleStartExtend(subscriptionId) {
    setExtendingSubscriptionId(subscriptionId);
    setExtendDays("");
    setNewExpiresAt("");
  }

  function handleCancelExtend() {
    setExtendingSubscriptionId(null);
    setExtendDays("");
    setNewExpiresAt("");
  }

  function handleStartChangeType(subscriptionId) {
    setChangingSubscriptionId(subscriptionId);
    setSelectedSubscriptionTypeId("");
  }

  function handleCancelChangeType() {
    setChangingSubscriptionId(null);
    setSelectedSubscriptionTypeId("");
  }

  async function handleAssignSubscription(userId) {
    if (!selectedSubscriptionTypeId) {
      showToast("Silakan pilih tipe langganan terlebih dahulu", "error");
      return;
    }

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Check if user already has an active subscription
    const existingActiveSubscription = user.subscriptions.find(
      (sub) => sub.isActive && !sub.isExpired
    );

    if (existingActiveSubscription) {
      const subscriptionTypeName = subscriptionTypes.find(
        (st) => st.id === selectedSubscriptionTypeId
      )?.name || "Tidak Diketahui";

      const confirmed = await showConfirm({
        title: "Konfirmasi Perubahan Langganan",
        description: `Pengguna ini sudah memiliki langganan aktif "${existingActiveSubscription.subscriptionTypeName}". Tindakan ini akan mengubah langganan menjadi "${subscriptionTypeName}". Apakah Anda yakin ingin melanjutkan?`,
        variant: "confirm",
        confirmText: "Ya, Ubah",
        cancelText: "Batal",
      });

      if (!confirmed) {
        return;
      }

      // Update existing subscription
      try {
        await updateSubscription.mutateAsync({
          id: existingActiveSubscription.id,
          subscriptionTypeId: selectedSubscriptionTypeId,
          recalculateExpiresAt: true,
        });
        showToast("Langganan berhasil diperbarui", "success");
        setAssigningUserId(null);
        setSelectedSubscriptionTypeId("");
      } catch (error) {
        showToast(`Gagal memperbarui langganan: ${error.message}`, "error");
      }
    } else {
      // Create new subscription (user doesn't have active subscription)
      try {
        await createSubscription.mutateAsync({
          userId: userId,
          subscriptionTypeId: selectedSubscriptionTypeId,
        });
        showToast("Langganan berhasil ditetapkan untuk pengguna", "success");
        setAssigningUserId(null);
        setSelectedSubscriptionTypeId("");
      } catch (error) {
        showToast(`Gagal menetapkan langganan: ${error.message}`, "error");
      }
    }
  }

  async function handleExtendSubscription(subscriptionId) {
    const subscription = users
      .flatMap((u) => u.subscriptions)
      .find((sub) => sub.id === subscriptionId);

    if (!subscription) return;

    let newExpiresAtDate = null;

    if (newExpiresAt) {
      newExpiresAtDate = new Date(newExpiresAt).toISOString();
    } else if (extendDays) {
      const days = parseInt(extendDays);
      if (isNaN(days) || days <= 0) {
        showToast("Jumlah hari harus berupa angka positif", "error");
        return;
      }
      const currentExpiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : new Date();
      newExpiresAtDate = new Date(currentExpiresAt);
      newExpiresAtDate.setDate(newExpiresAtDate.getDate() + days);
      newExpiresAtDate = newExpiresAtDate.toISOString();
    } else {
      showToast("Silakan masukkan jumlah hari tambahan atau tanggal berakhir baru", "error");
      return;
    }

    try {
      await updateSubscription.mutateAsync({
        id: subscriptionId,
        expiresAt: newExpiresAtDate,
      });
      showToast("Langganan berhasil diperpanjang", "success");
      handleCancelExtend();
    } catch (error) {
      showToast(`Gagal memperpanjang langganan: ${error.message}`, "error");
    }
  }

  async function handleChangeSubscriptionType(subscriptionId) {
    if (!selectedSubscriptionTypeId) {
      showToast("Silakan pilih tipe langganan terlebih dahulu", "error");
      return;
    }

    const subscription = users
      .flatMap((u) => u.subscriptions)
      .find((sub) => sub.id === subscriptionId);

    if (!subscription) return;

    const newSubscriptionTypeName = subscriptionTypes.find(
      (st) => st.id === selectedSubscriptionTypeId
    )?.name || "Tidak Diketahui";

    const confirmed = await showConfirm({
      title: "Konfirmasi Perubahan Tipe Langganan",
      description: `Apakah Anda yakin ingin mengubah tipe langganan dari "${subscription.subscriptionTypeName}" menjadi "${newSubscriptionTypeName}"?`,
      variant: "confirm",
      confirmText: "Ya, Ubah",
      cancelText: "Batal",
    });

    if (!confirmed) {
      return;
    }

    try {
      await updateSubscription.mutateAsync({
        id: subscriptionId,
        subscriptionTypeId: selectedSubscriptionTypeId,
        recalculateExpiresAt: true,
      });
      showToast("Tipe langganan berhasil diubah", "success");
      handleCancelChangeType();
    } catch (error) {
      showToast(`Gagal mengubah tipe langganan: ${error.message}`, "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Langganan Pengguna</h1>
        <p className="text-gray-600 mt-2">
          Kelola dan pantau status langganan untuk setiap pengguna ({filteredUsers.length} pengguna)
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cari Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  label="Cari Pengguna (Nama atau Email)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan nama atau email pengguna"
                />
                <Search className="absolute right-3 top-9 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            {filteredUsers.length === 0
              ? "Tidak ada pengguna yang ditemukan"
              : `${filteredUsers.length} pengguna ditemukan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada pengguna yang ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Langganan Aktif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.subscriptions.length > 0 ? (
                          <div className="space-y-2">
                            {user.subscriptions
                              .filter((sub) => sub.isActive)
                              .map((sub) => {
                                const statusBadge = getSubscriptionStatusBadge(sub);
                                const remainingDays = getRemainingDays(sub.expiresAt);
                                return (
                                  <div key={sub.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold text-gray-900">{sub.subscriptionTypeName}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs ${statusBadge.color}`}>
                                        {statusBadge.text}
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>Mulai: {formatDate(sub.startedAt)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        <span>Berakhir: {formatDate(sub.expiresAt)}</span>
                                      </div>
                                      {remainingDays !== null && remainingDays >= 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {remainingDays === 0
                                            ? "Berakhir hari ini"
                                            : remainingDays === 1
                                            ? "Berakhir besok"
                                            : `Berakhir dalam ${remainingDays} hari`}
                                        </div>
                                      )}
                                      {remainingDays !== null && remainingDays < 0 && (
                                        <div className="text-xs text-red-600 mt-1">
                                          Kadaluarsa {Math.abs(remainingDays)} hari yang lalu
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            {user.subscriptions.filter((sub) => sub.isActive).length === 0 && (
                              <span className="text-gray-400 text-sm">Tidak ada langganan aktif</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Belum memiliki langganan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                          user.hasActiveSubscription
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.hasActiveSubscription ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.hasActiveSubscription ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const activeSubscription = user.subscriptions.find(
                            (sub) => sub.isActive
                          );

                          // Extend form
                          if (extendingSubscriptionId === activeSubscription?.id) {
                            return (
                              <div className="flex flex-col gap-2 min-w-[280px]">
                                <Input
                                  label="Tambah Hari"
                                  type="number"
                                  min="1"
                                  value={extendDays}
                                  onChange={(e) => {
                                    setExtendDays(e.target.value);
                                    setNewExpiresAt("");
                                  }}
                                  placeholder="Contoh: 30"
                                />
                                <div className="text-xs text-gray-500">atau</div>
                                <Input
                                  label="Tanggal Berakhir Baru"
                                  type="date"
                                  value={newExpiresAt}
                                  onChange={(e) => {
                                    setNewExpiresAt(e.target.value);
                                    setExtendDays("");
                                  }}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleExtendSubscription(activeSubscription.id)}
                                    disabled={updateSubscription.isPending}
                                  >
                                    {updateSubscription.isPending ? "Memproses..." : "Perpanjang"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCancelExtend}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          // Change type form
                          if (changingSubscriptionId === activeSubscription?.id) {
                            return (
                              <div className="flex flex-col gap-2 min-w-[250px]">
                                <Select
                                  value={selectedSubscriptionTypeId}
                                  onChange={(e) => setSelectedSubscriptionTypeId(e.target.value)}
                                  options={[
                                    { value: "", label: "Pilih Tipe Langganan" },
                                    ...subscriptionTypes
                                      .filter((st) => st.id !== activeSubscription.subscriptionTypeId)
                                      .map((st) => ({
                                        value: st.id,
                                        label: `${st.name} (Rp ${st.price.toLocaleString("id-ID")})`,
                                      })),
                                  ]}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleChangeSubscriptionType(activeSubscription.id)}
                                    disabled={updateSubscription.isPending}
                                  >
                                    {updateSubscription.isPending ? "Memproses..." : "Ganti"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCancelChangeType}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          // Assign form (for users without subscription)
                          if (assigningUserId === user.id) {
                            return (
                              <div className="flex flex-col gap-2 min-w-[250px]">
                                <Select
                                  value={selectedSubscriptionTypeId}
                                  onChange={(e) => setSelectedSubscriptionTypeId(e.target.value)}
                                  options={[
                                    { value: "", label: "Pilih Tipe Langganan" },
                                    ...subscriptionTypes.map((st) => ({
                                      value: st.id,
                                      label: `${st.name} (Rp ${st.price.toLocaleString("id-ID")})`,
                                    })),
                                  ]}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAssignSubscription(user.id)}
                                    disabled={createSubscription.isPending || updateSubscription.isPending}
                                  >
                                    {createSubscription.isPending || updateSubscription.isPending
                                      ? "Menyimpan..."
                                      : "Simpan"}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCancelAssign}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            );
                          }

                          // Action buttons
                          if (activeSubscription) {
                            return (
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleStartExtend(activeSubscription.id)}
                                >
                                  <Clock className="w-4 h-4 mr-1" />
                                  Perpanjang
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleStartChangeType(activeSubscription.id)}
                                >
                                  Ganti Tipe
                                </Button>
                              </div>
                            );
                          }

                          // No subscription - show assign button
                          return (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartAssign(user.id)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Atur Langganan
                            </Button>
                          );
                        })()}
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

"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { transactionSchema } from "@/lib/validations/transactionSchema";
import { useSubscriptionTypes } from "@/hooks/useSubscriptionTypes";

export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
}) {
  const { data: subscriptionTypes = [] } = useSubscriptionTypes();
  const [formData, setFormData] = useState({
    userId: "",
    subscriptionTypeId: "",
    amount: "",
    paymentMethod: "",
    paymentStatus: "pending",
    metadata: {},
  });
  const [errors, setErrors] = useState({});
  const [metadataJson, setMetadataJson] = useState("{}");

  useEffect(() => {
    if (initialData) {
      setFormData({
        userId: initialData.userId || "",
        subscriptionTypeId: initialData.subscriptionTypeId || "",
        amount: initialData.amount?.toString() || "",
        paymentMethod: initialData.paymentMethod || "",
        paymentStatus: initialData.paymentStatus || "pending",
        metadata: initialData.metadata || {},
      });
      setMetadataJson(JSON.stringify(initialData.metadata || {}, null, 2));
    }
  }, [initialData]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  function handleMetadataChange(value) {
    setMetadataJson(value);
    try {
      const parsed = JSON.parse(value);
      handleChange("metadata", parsed);
      if (errors.metadata) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.metadata;
          return newErrors;
        });
      }
    } catch (e) {
      // Invalid JSON, will be caught in validation
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    try {
      // Parse metadata JSON
      let metadata = {};
      if (metadataJson.trim()) {
        try {
          metadata = JSON.parse(metadataJson);
        } catch (e) {
          setErrors({ metadata: "Metadata harus berupa format JSON yang valid" });
          return;
        }
      }

      const validated = transactionSchema.parse({
        ...formData,
        metadata,
      });
      onSubmit(validated);
    } catch (error) {
      if (error.errors) {
        const newErrors = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  }

  const paymentStatusOptions = [
    { value: "pending", label: "Menunggu Pembayaran" },
    { value: "paid", label: "Lunas" },
    { value: "failed", label: "Gagal" },
    { value: "cancelled", label: "Dibatalkan" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="ID Pengguna (UUID)"
        value={formData.userId}
        onChange={(e) => handleChange("userId", e.target.value)}
        error={errors.userId}
        required
        placeholder="Masukkan UUID pengguna"
      />

      <Select
        label="Tipe Langganan"
        value={formData.subscriptionTypeId}
        onChange={(e) => handleChange("subscriptionTypeId", e.target.value)}
        error={errors.subscriptionTypeId}
        required
        options={[
          { value: "", label: "Pilih Tipe Langganan" },
          ...subscriptionTypes.map((st) => ({
            value: st.id,
            label: `${st.name} (Rp ${st.price.toLocaleString("id-ID")})`,
          })),
        ]}
      />

      <Input
        label="Jumlah Pembayaran"
        type="number"
        step="0.01"
        min="0"
        value={formData.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        error={errors.amount}
        required
        placeholder="0"
      />

      <Input
        label="Metode Pembayaran"
        value={formData.paymentMethod}
        onChange={(e) => handleChange("paymentMethod", e.target.value)}
        error={errors.paymentMethod}
        placeholder="Contoh: Transfer Bank, Tunai, E-Wallet"
      />

      <Select
        label="Status Pembayaran"
        value={formData.paymentStatus}
        onChange={(e) => handleChange("paymentStatus", e.target.value)}
        error={errors.paymentStatus}
        required
        options={paymentStatusOptions}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Metadata (JSON) - Opsional
        </label>
        <textarea
          value={metadataJson}
          onChange={(e) => handleMetadataChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder='{"note": "Pembayaran manual", "reference": "REF123", "bank": "BCA"}'
        />
        {errors.metadata && (
          <p className="text-sm text-red-600 mt-1">{errors.metadata}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Informasi tambahan dalam format JSON (opsional). Contoh: catatan pembayaran, nomor referensi, atau informasi bank.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}


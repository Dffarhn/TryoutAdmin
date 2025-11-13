"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { tryoutSessionSchema } from "@/lib/validations/tryoutSessionSchema";
import { usePackages } from "@/hooks/usePackages";
import { useSubscriptionTypes } from "@/hooks/useSubscriptionTypes";

export function TryoutSessionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
}) {
  const { data: packages = [] } = usePackages();
  const { data: subscriptionTypes = [] } = useSubscriptionTypes();
  const [formData, setFormData] = useState({
    packageId: "",
    subscriptionTypeId: "",
    availableUntil: "",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        packageId: initialData.packageId || "",
        subscriptionTypeId: initialData.subscriptionTypeId || "",
        availableUntil: initialData.availableUntil 
          ? new Date(initialData.availableUntil).toISOString().slice(0, 16)
          : "",
        isActive: initialData.isActive ?? true,
      });
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

  function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    try {
      const validated = tryoutSessionSchema.parse({
        ...formData,
        availableUntil: formData.availableUntil 
          ? new Date(formData.availableUntil).toISOString()
          : null,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Package"
        value={formData.packageId}
        onChange={(e) => handleChange("packageId", e.target.value)}
        error={errors.packageId}
        required
        options={[
          { value: "", label: "Pilih Package" },
          ...packages.map((p) => ({
            value: p.id,
            label: p.name,
          })),
        ]}
      />

      <Select
        label="Subscription Type"
        value={formData.subscriptionTypeId}
        onChange={(e) => handleChange("subscriptionTypeId", e.target.value)}
        error={errors.subscriptionTypeId}
        required
        options={[
          { value: "", label: "Pilih Subscription Type" },
          ...subscriptionTypes.map((st) => ({
            value: st.id,
            label: `${st.name} (Rp ${st.price.toLocaleString("id-ID")})`,
          })),
        ]}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Until (Opsional)
        </label>
        <input
          type="datetime-local"
          value={formData.availableUntil}
          onChange={(e) => handleChange("availableUntil", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Batas waktu akses untuk tryout ini. Kosongkan jika tidak ada batas waktu.
        </p>
        {errors.availableUntil && (
          <p className="text-sm text-red-600 mt-1">{errors.availableUntil}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Aktif
        </label>
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


"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { subscriptionTypeSchema } from "@/lib/validations/subscriptionTypeSchema";

export function SubscriptionTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationDays: 30,
    features: {},
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [featuresJson, setFeaturesJson] = useState("{}");

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price?.toString() || "",
        durationDays: initialData.durationDays || 30,
        features: initialData.features || {},
        isActive: initialData.isActive ?? true,
      });
      setFeaturesJson(JSON.stringify(initialData.features || {}, null, 2));
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

  function handleFeaturesChange(value) {
    setFeaturesJson(value);
    try {
      const parsed = JSON.parse(value);
      handleChange("features", parsed);
      if (errors.features) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.features;
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
      // Parse features JSON
      let features = {};
      if (featuresJson.trim()) {
        try {
          features = JSON.parse(featuresJson);
        } catch (e) {
          setErrors({ features: "Features harus berupa JSON yang valid" });
          return;
        }
      }

      const validated = subscriptionTypeSchema.parse({
        ...formData,
        features,
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
      <Input
        label="Nama Tipe Langganan"
        value={formData.name}
        onChange={(e) => handleChange("name", e.target.value)}
        error={errors.name}
        required
        placeholder="Contoh: Paket Bulanan, Paket Tahunan"
      />

      <Textarea
        label="Deskripsi"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        error={errors.description}
        rows={3}
        placeholder="Jelaskan keuntungan dan fitur yang didapat dengan tipe langganan ini"
      />

      <Input
        label="Harga"
        type="number"
        step="0.01"
        min="0"
        value={formData.price}
        onChange={(e) => handleChange("price", e.target.value)}
        error={errors.price}
        required
        placeholder="0"
      />

      <Input
        label="Durasi Berlangganan (Hari)"
        type="number"
        min="1"
        value={formData.durationDays}
        onChange={(e) => handleChange("durationDays", parseInt(e.target.value) || 30)}
        error={errors.durationDays}
        required
        placeholder="30"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fitur Tambahan (JSON)
        </label>
        <Textarea
          value={featuresJson}
          onChange={(e) => handleFeaturesChange(e.target.value)}
          error={errors.features}
          rows={6}
          className="font-mono text-sm"
          placeholder='{"daily_tryout": true, "batch_nasional": true, "progressive": true, "max_sessions": 100}'
        />
        <p className="text-xs text-gray-500 mt-1">
          Format JSON untuk mengatur fitur tambahan yang tersedia pada tipe langganan ini
        </p>
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
          Aktifkan tipe langganan ini
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


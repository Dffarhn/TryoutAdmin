"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { usePackages } from "@/hooks/usePackages";
import { tryoutSchema } from "@/lib/validations/tryoutSchema";

export function TryoutForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
}) {
  const { data: packages = [], isLoading: packagesLoading } = usePackages(true); // Only active packages

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    isActive: true,
    packageName: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        durationMinutes: initialData.durationMinutes || 60,
        isActive: initialData.isActive ?? true,
        packageName: initialData.packageName || "",
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
      const validated = tryoutSchema.parse({
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
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
        label="Judul"
        value={formData.title}
        onChange={(e) => handleChange("title", e.target.value)}
        error={errors.title}
        required
      />

      <Textarea
        label="Deskripsi"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        error={errors.description}
        rows={4}
      />

      <Input
        label="Durasi (menit)"
        type="number"
        value={formData.durationMinutes}
        onChange={(e) => handleChange("durationMinutes", e.target.value)}
        error={errors.durationMinutes}
        required
        min={1}
      />

      <Select
        label="Paket"
        value={formData.packageName}
        onChange={(e) => handleChange("packageName", e.target.value)}
        error={errors.packageName}
        options={packages.map((pkg) => ({
          value: pkg.name,
          label: pkg.name,
        }))}
        placeholder="Pilih paket..."
        disabled={packagesLoading}
        required
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-700">Aktif</span>
      </label>

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


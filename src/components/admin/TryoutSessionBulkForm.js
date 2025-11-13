"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { usePackages } from "@/hooks/usePackages";
import { useSubscriptionTypes } from "@/hooks/useSubscriptionTypes";
import { tryoutSessionSchema } from "@/lib/validations/tryoutSessionSchema";
import { Plus, X, GripVertical } from "lucide-react";

export function TryoutSessionBulkForm({
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan Semua",
}) {
  const { data: packages = [] } = usePackages();
  const { data: subscriptionTypes = [] } = useSubscriptionTypes();
  const [subscriptionTypeId, setSubscriptionTypeId] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [draggedPackage, setDraggedPackage] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [errors, setErrors] = useState({});

  function addPackage(packageId) {
    if (!packageId || selectedPackages.includes(packageId)) return;
    setSelectedPackages([...selectedPackages, packageId]);
    // Clear error
    if (errors.packages) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.packages;
        return newErrors;
      });
    }
  }

  function removePackage(packageId) {
    setSelectedPackages(selectedPackages.filter((id) => id !== packageId));
  }

  function handleDragStart(e, packageId) {
    setDraggedPackage(packageId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedPackage === null) return;

    const newPackages = [...selectedPackages];
    const draggedIndex = newPackages.indexOf(draggedPackage);

    if (draggedIndex === -1) return;

    // Remove from old position
    newPackages.splice(draggedIndex, 1);
    // Insert at new position
    newPackages.splice(dropIndex, 0, draggedPackage);

    setSelectedPackages(newPackages);
    setDraggedPackage(null);
  }

  function handleDragEnd() {
    setDraggedPackage(null);
    setDragOverIndex(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    // Validate subscription type
            if (!subscriptionTypeId) {
              setErrors({ subscriptionTypeId: "Tipe langganan wajib dipilih" });
              return;
            }

            if (selectedPackages.length === 0) {
              setErrors({ packages: "Minimal harus ada 1 paket yang dipilih" });
              return;
            }

    // Validate each package
    const validatedRows = [];

    selectedPackages.forEach((packageId) => {
      const validated = tryoutSessionSchema.parse({
        packageId: packageId,
        subscriptionTypeId: subscriptionTypeId,
        availableUntil: availableUntil
          ? new Date(availableUntil).toISOString()
          : null,
        isActive: isActive,
      });
      validatedRows.push(validated);
    });

    onSubmit(validatedRows);
  }

  // Get selected subscription type name for display
  const selectedSubscriptionType = subscriptionTypes.find(
    (st) => st.id === subscriptionTypeId
  );

  // Available packages (not yet selected)
  const availablePackages = packages.filter(
    (p) => !selectedPackages.includes(p.id)
  );

  // Selected packages with full data
  const selectedPackagesData = selectedPackages
    .map((id) => packages.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subscription Type Selection */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pilih Tipe Langganan
        </h3>
        <Select
          label="Tipe Langganan"
          value={subscriptionTypeId}
          onChange={(e) => {
            setSubscriptionTypeId(e.target.value);
            if (errors.subscriptionTypeId) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.subscriptionTypeId;
                return newErrors;
              });
            }
          }}
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
        {selectedSubscriptionType && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Tipe Langganan Terpilih:</span> {selectedSubscriptionType.name}
            </p>
          </div>
        )}
      </div>

      {/* Packages Selection - Only show if subscription type is selected */}
      {subscriptionTypeId && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Pilih Paket Tryout
            </h3>
            <p className="text-sm text-gray-600">
              Seret dan lepas paket dari daftar tersedia ke daftar terpilih, atau klik paket untuk menambahkannya. Anda dapat mengatur urutan paket dengan drag & drop.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Packages */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Paket Tersedia ({availablePackages.length})
              </h4>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto space-y-2">
                {availablePackages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Semua paket telah dipilih
                  </p>
                ) : (
                  availablePackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pkg.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => addPackage(pkg.id)}
                      className="p-3 bg-white border border-gray-200 rounded-md cursor-move hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {pkg.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addPackage(pkg.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                        title="Klik untuk menambahkan paket"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Packages */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Paket Terpilih ({selectedPackages.length})
              </h4>
              <div
                className="border border-gray-200 rounded-lg p-3 bg-gray-50 min-h-[200px] space-y-2"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (selectedPackages.length === 0) {
                    setDragOverIndex(0);
                  }
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedPackage && !selectedPackages.includes(draggedPackage)) {
                    addPackage(draggedPackage);
                  }
                  setDragOverIndex(null);
                }}
              >
                {selectedPackages.length === 0 ? (
                  <div
                    className={`p-8 border-2 border-dashed rounded-md text-center ${
                      dragOverIndex === 0
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <p className="text-sm text-gray-500">
                      {dragOverIndex === 0
                        ? "Lepaskan paket di sini"
                        : "Seret dan lepas paket di sini atau klik dari daftar tersedia"}
                    </p>
                  </div>
                ) : (
                  selectedPackagesData.map((pkg, index) => (
                    <div
                      key={pkg.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pkg.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-white border rounded-md cursor-move transition-colors flex items-center justify-between group ${
                        dragOverIndex === index
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}. {pkg.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePackage(pkg.id)}
                        className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus paket dari daftar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {errors.packages && (
                <p className="text-sm text-red-600 mt-2">{errors.packages}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Common Settings - Only show if subscription type is selected */}
      {subscriptionTypeId && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pengaturan Umum
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Pengaturan berikut akan diterapkan secara seragam ke semua paket yang dipilih.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batas Waktu Akses (Opsional)
              </label>
              <input
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tentukan batas waktu akses untuk semua paket. Biarkan kosong jika akses tidak terbatas.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Aktifkan semua hubungan paket
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
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


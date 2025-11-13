"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createAdminSchema, updateAdminSchema } from "@/lib/validations/adminSchema";

export function AdminForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
  mode = "create",
}) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    isSuperAdmin: false,
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || "",
        password: "",
        confirmPassword: "",
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        isSuperAdmin: initialData.isSuperAdmin || false,
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  // Check if form is valid for create mode
  const isFormValid = useMemo(() => {
    if (mode === "create") {
      return (
        formData.username.trim().length >= 3 &&
        formData.password.trim().length >= 6 &&
        formData.confirmPassword.trim().length >= 6 &&
        formData.password === formData.confirmPassword
      );
    }
    // For edit mode, at least username should be filled
    return formData.username.trim().length >= 3;
  }, [formData, mode]);

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
      if (mode === "create") {
        // Ensure confirmPassword is included for validation
        const dataToValidate = {
          username: formData.username.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          fullName: formData.fullName.trim() || undefined,
          email: formData.email.trim() || "",
          isSuperAdmin: formData.isSuperAdmin,
        };
        
        const validated = createAdminSchema.parse(dataToValidate);
        // Convert empty strings to null for API
        const emailValue = validated.email?.trim();
        const fullNameValue = validated.fullName?.trim();
        onSubmit({
          username: validated.username,
          password: validated.password,
          fullName: fullNameValue || null,
          email: emailValue && emailValue !== "" ? emailValue : null,
          isSuperAdmin: validated.isSuperAdmin,
        });
      } else {
        const validated = updateAdminSchema.parse(formData);
        const updateData = {};
        if (validated.username) updateData.username = validated.username;
        if (validated.password && validated.password.trim() !== "") {
          updateData.password = validated.password;
        }
        if (validated.fullName !== undefined) {
          updateData.fullName = validated.fullName || null;
        }
        if (validated.email !== undefined) {
          updateData.email = validated.email || null;
        }
        if (validated.isSuperAdmin !== undefined) {
          updateData.isSuperAdmin = validated.isSuperAdmin;
        }
        if (validated.isActive !== undefined) {
          updateData.isActive = validated.isActive;
        }
        onSubmit(updateData);
      }
    } catch (error) {
      if (error.errors) {
        const newErrors = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        setErrors({ submit: error.message || "Terjadi kesalahan" });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.submit}</p>
        </div>
      )}

      <Input
        label="Username"
        type="text"
        value={formData.username}
        onChange={(e) => handleChange("username", e.target.value)}
        error={errors.username}
        required
        placeholder="minimal 3 karakter"
        disabled={isLoading}
      />

      {mode === "create" && (
        <>
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            required
            placeholder="minimal 6 karakter"
            disabled={isLoading}
          />

          <Input
            label="Konfirmasi Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            required
            placeholder="ulangi password"
            disabled={isLoading}
          />
        </>
      )}

      {mode === "edit" && (
        <Input
          label="Password Baru (opsional)"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={errors.password}
          placeholder="kosongkan jika tidak ingin mengubah"
          disabled={isLoading}
        />
      )}

      <Input
        label="Nama Lengkap"
        type="text"
        value={formData.fullName}
        onChange={(e) => handleChange("fullName", e.target.value)}
        error={errors.fullName}
        placeholder="opsional"
        disabled={isLoading}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange("email", e.target.value)}
        error={errors.email}
        placeholder="opsional"
        disabled={isLoading}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isSuperAdmin"
          checked={formData.isSuperAdmin}
          onChange={(e) => handleChange("isSuperAdmin", e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label htmlFor="isSuperAdmin" className="text-sm font-medium text-gray-700">
          Super Admin
        </label>
      </div>

      {mode === "edit" && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange("isActive", e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Aktif
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading || !isFormValid}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Menyimpan...
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}

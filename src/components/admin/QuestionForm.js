"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useCategories } from "@/hooks/useCategories";
import { questionSchema } from "@/lib/validations/questionSchema";

export function QuestionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
  defaultCategoryId, // OPSIONAL: untuk auto-fill category dari sub-chapter
}) {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const [formData, setFormData] = useState({
    categoryId: defaultCategoryId || "",
    text: "",
    explanation: "",
    link: "",
    answerOptions: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryId: initialData.categoryId || defaultCategoryId || "",
        text: initialData.text || "",
        explanation: initialData.explanation || "",
        link: initialData.link || "",
        answerOptions:
          initialData.answerOptions?.map((opt) => ({
            id: opt.id,
            text: opt.text || "",
            isCorrect: opt.isCorrect || false,
          })) || [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
      });
      if (initialData.link) {
        setImagePreview(initialData.link);
      }
    } else if (defaultCategoryId) {
      // Auto-fill category jika ada defaultCategoryId dan tidak ada initialData
      setFormData((prev) => ({
        ...prev,
        categoryId: defaultCategoryId,
      }));
    }
  }, [initialData, defaultCategoryId]);

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

  function handleAnswerOptionChange(index, field, value) {
    setFormData((prev) => {
      const newOptions = [...prev.answerOptions];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, answerOptions: newOptions };
    });
    
    // Clear error untuk opsi ini saat user mengetik
    const errorKey = `answerOptions.${index}.text`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    
    // Clear error answerOptions umum jika ada
    if (errors.answerOptions) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.answerOptions;
        return newErrors;
      });
    }
  }

  function handleAddOption() {
    setFormData((prev) => ({
      ...prev,
      answerOptions: [...prev.answerOptions, { text: "", isCorrect: false }],
    }));
  }

  function handleRemoveOption(index) {
    if (formData.answerOptions.length <= 2) return;
    setFormData((prev) => ({
      ...prev,
      answerOptions: prev.answerOptions.filter((_, i) => i !== index),
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        link: "Tipe file tidak didukung. Hanya gambar yang diperbolehkan.",
      }));
      return;
    }

    // Validasi ukuran file (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        link: "Ukuran file melebihi 10 MB",
      }));
      return;
    }

    setUploading(true);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.link;
      return newErrors;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", "80");
      formData.append("maxWidth", "1920");
      formData.append("maxHeight", "1920");

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Set link dari publicUrl
        setFormData((prev) => ({
          ...prev,
          link: data.data.publicUrl,
        }));
        setImagePreview(data.data.publicUrl);
      } else {
        throw new Error(data.error || "Upload gagal");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrors((prev) => ({
        ...prev,
        link: error.message || "Upload gagal",
      }));
    } finally {
      setUploading(false);
    }
  }

  function handleLinkChange(value) {
    setFormData((prev) => ({ ...prev, link: value }));
    if (value) {
      setImagePreview(value);
    } else {
      setImagePreview(null);
    }
    if (errors.link) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.link;
        return newErrors;
      });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    try {
      // Prepare data - convert empty categoryId and link to undefined (optional)
      const submitData = {
        ...formData,
        categoryId: formData.categoryId?.trim() || undefined, // Convert empty string to undefined
        link: formData.link?.trim() || undefined, // Convert empty string to undefined
      };
      
      const validated = questionSchema.parse(submitData);
      onSubmit(validated);
    } catch (error) {
      const newErrors = {};
      
      // Handle Zod validation errors
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const key = err.path.join(".");
            newErrors[key] = err.message;
          } else if (err.message) {
            // Handle error tanpa path (seperti refine errors untuk answerOptions)
            if (err.message.includes("opsi") || err.message.includes("jawaban")) {
              newErrors.answerOptions = err.message;
            } else {
              newErrors._general = err.message;
            }
          }
        });
      } else if (error.issues && Array.isArray(error.issues)) {
        // Handle Zod issues format
        error.issues.forEach((issue) => {
          if (issue.path && issue.path.length > 0) {
            const key = issue.path.join(".");
            newErrors[key] = issue.message;
          } else if (issue.message) {
            if (issue.message.includes("opsi") || issue.message.includes("jawaban")) {
              newErrors.answerOptions = issue.message;
            } else {
              newErrors._general = issue.message;
            }
          }
        });
      } else if (error.message) {
        // Fallback untuk error yang tidak terstruktur
        newErrors._general = error.message;
      }
      
      setErrors(newErrors);
      
      // Scroll ke error pertama setelah render
      setTimeout(() => {
        const firstErrorKey = Object.keys(newErrors)[0];
        if (firstErrorKey && firstErrorKey !== "_general") {
          const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 100);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Select
        label="Kategori (Opsional)"
        value={formData.categoryId}
        onChange={(e) => handleChange("categoryId", e.target.value)}
        error={errors.categoryId}
        options={categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))}
        placeholder="Pilih kategori untuk filtering..."
        disabled={categoriesLoading}
      />

      <div data-error-field="text">
        <Textarea
          label="Teks Soal"
          value={formData.text}
          onChange={(e) => handleChange("text", e.target.value)}
          error={errors.text}
          required
          rows={4}
        />
        {errors.text && (
          <p className="text-sm text-red-500 mt-1">{errors.text}</p>
        )}
      </div>

      <Textarea
        label="Penjelasan (Opsional)"
        value={formData.explanation}
        onChange={(e) => handleChange("explanation", e.target.value)}
        error={errors.explanation}
        rows={3}
      />

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Gambar Soal (Opsional)
        </label>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                error={errors.link}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
            </div>
            {uploading && (
              <div className="flex items-center text-sm text-gray-500">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Mengupload...
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Atau masukkan link gambar langsung:
          </div>
          <div data-error-field="link">
            <Input
              type="url"
              value={formData.link}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://drive.google.com/uc?export=view&id=..."
              error={errors.link}
            />
            {errors.link && (
              <p className="text-sm text-red-500 mt-1">{errors.link}</p>
            )}
          </div>
          {imagePreview && (
            <div className="mt-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-md rounded-lg border border-gray-200"
                onError={() => setImagePreview(null)}
              />
              <p className="text-xs text-gray-500 mt-2">
                Link:{" "}
                <a
                  href={imagePreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {imagePreview}
                </a>
              </p>
              <Button
                type="button"
                variant="danger"
                className="text-xs mt-2"
                onClick={() => {
                  handleLinkChange("");
                  setImagePreview(null);
                }}
              >
                Hapus Gambar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-gray-700">
            Opsi Jawaban <span className="text-red-500">*</span>
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddOption}
            className="text-xs"
          >
            + Tambah Opsi
          </Button>
        </div>

        {errors.answerOptions && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg" data-error-field="answerOptions">
            <p className="text-sm text-red-600 font-medium">{errors.answerOptions}</p>
          </div>
        )}

        <div className="space-y-3">
          {formData.answerOptions.map((option, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 border rounded-lg ${
                errors[`answerOptions.${index}.text`] 
                  ? "border-red-300 bg-red-50" 
                  : "border-gray-200"
              }`}
              data-error-field={`answerOptions.${index}.text`}
            >
              <input
                type="radio"
                name="correct-answer"
                checked={option.isCorrect}
                onChange={() => {
                  const newOptions = formData.answerOptions.map((opt, i) => ({
                    ...opt,
                    isCorrect: i === index,
                  }));
                  setFormData((prev) => ({ ...prev, answerOptions: newOptions }));
                  
                  // Clear error saat memilih jawaban benar
                  if (errors.answerOptions) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.answerOptions;
                      return newErrors;
                    });
                  }
                }}
                className="mt-1.5"
              />
              <div className="flex-1">
                <Input
                  value={option.text}
                  onChange={(e) =>
                    handleAnswerOptionChange(index, "text", e.target.value)
                  }
                  placeholder={`Opsi ${index + 1}${index < 2 ? " (Wajib)" : ""}`}
                  error={errors[`answerOptions.${index}.text`]}
                />
                {errors[`answerOptions.${index}.text`] && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors[`answerOptions.${index}.text`]}
                  </p>
                )}
              </div>
              {formData.answerOptions.length > 2 && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleRemoveOption(index)}
                  className="text-xs px-3 py-1.5"
                >
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {/* Info tambahan */}
        <div className="mt-2 text-xs text-gray-500">
          <p>• Minimal 2 opsi jawaban harus diisi</p>
          <p>• Pilih 1 opsi sebagai jawaban benar (klik radio button)</p>
        </div>
      </div>

      {/* General error message */}
      {errors._general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors._general}</p>
        </div>
      )}

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


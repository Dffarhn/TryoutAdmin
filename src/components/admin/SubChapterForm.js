"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useCategories } from "@/hooks/useCategories";
import { subChapterSchema } from "@/lib/validations/subChapterSchema";
import { cn } from "@/lib/utils/cn";
import { Plus } from "lucide-react";

export function SubChapterForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Simpan",
  existingSubChapters = [], // Array of existing sub-chapters to check for used categories
}) {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const [formData, setFormData] = useState({
    orderIndex: 0,
    categoryId: "",
  });
  const [errors, setErrors] = useState({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const isInitialMount = useRef(true);

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        orderIndex: initialData.orderIndex ?? 0,
        categoryId: initialData.categoryId || "",
      });
      setShowNewCategory(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      isInitialMount.current = true;
      
      // Sync category search if categories are already loaded
      if (!categoriesLoading && categories.length > 0 && initialData.categoryId) {
        const selectedCategory = categories.find(
          (cat) => cat.id === initialData.categoryId
        );
        if (selectedCategory) {
          setCategorySearch(selectedCategory.name);
        }
      }
    } else {
      // Reset form when no initial data
      setFormData({
        orderIndex: 0,
        categoryId: "",
      });
      setCategorySearch("");
      setShowNewCategory(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      isInitialMount.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Sync category search when categories finish loading (only if we have categoryId from initialData)
  useEffect(() => {
    if (
      !categoriesLoading &&
      categories.length > 0 &&
      formData.categoryId &&
      isInitialMount.current &&
      !showNewCategory &&
      !categorySearch
    ) {
      const selectedCategory = categories.find(
        (cat) => cat.id === formData.categoryId
      );
      if (selectedCategory) {
        setCategorySearch(selectedCategory.name);
      }
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesLoading]);

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

  // Get category IDs that are already used by other sub-chapters
  // Exclude the current sub-chapter being edited
  const usedCategoryIds = new Set(
    existingSubChapters
      .filter((sc) => sc.id !== initialData?.id && sc.categoryId)
      .map((sc) => sc.categoryId)
  );

  // Filter available categories (not used by other sub-chapters)
  const availableCategories = categories.filter(
    (cat) => !usedCategoryIds.has(cat.id) || cat.id === formData.categoryId
  );

  // Filter categories based on search
  const filteredCategories = availableCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Handle category selection from dropdown
  function handleCategorySelect(category) {
    setFormData((prev) => ({ ...prev, categoryId: category.id }));
    setCategorySearch(category.name);
    setShowCategoryDropdown(false);
    setShowNewCategory(false);
    setNewCategoryName("");
    setNewCategoryDescription("");
    isInitialMount.current = false; // Mark that user has interacted
    if (errors.categoryId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.categoryId;
        return newErrors;
      });
    }
  }

  // Handle category search input
  function handleCategorySearchChange(value) {
    setCategorySearch(value);
    setShowCategoryDropdown(true);
    
    // Check if exact match exists
    const exactMatch = categories.find(
      (cat) => cat.name.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      setFormData((prev) => ({ ...prev, categoryId: exactMatch.id }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    }
  }

  // Handle new category button
  function handleNewCategoryClick() {
    setShowNewCategory(true);
    setCategorySearch("");
    setFormData((prev) => ({ ...prev, categoryId: "" }));
    setNewCategoryName("");
    setNewCategoryDescription("");
    setShowCategoryDropdown(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setErrors({});

    // Validate new category if showing
    if (showNewCategory) {
      if (!newCategoryName || !newCategoryName.trim()) {
        setErrors((prev) => ({
          ...prev,
          newCategoryName: "Nama kategori baru wajib diisi",
        }));
        return;
      }
    }

    try {
      const validated = subChapterSchema.parse({
        ...formData,
        orderIndex: Number(formData.orderIndex),
      });
      
      // Pass additional data for new category
      onSubmit({
        ...validated,
        newCategory: showNewCategory
          ? {
              name: newCategoryName.trim(),
              description: newCategoryDescription.trim() || null,
            }
          : null,
      });
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
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Kategori
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={categoryInputRef}
              value={showNewCategory ? "" : categorySearch}
              onChange={(e) => handleCategorySearchChange(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              placeholder="Ketik untuk mencari kategori..."
              disabled={categoriesLoading || showNewCategory}
              className={cn(
                "w-full px-3 py-2 border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:cursor-not-allowed",
                errors.categoryId && "border-red-500 focus:ring-red-500"
              )}
            />
            {showCategoryDropdown &&
              !showNewCategory &&
              filteredCategories.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors",
                        formData.categoryId === cat.id && "bg-indigo-50"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            {showCategoryDropdown &&
              !showNewCategory &&
              categorySearch &&
              filteredCategories.length === 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-500"
                >
                  {availableCategories.length === 0
                    ? "Semua kategori sudah digunakan"
                    : "Kategori tidak ditemukan"}
                </div>
              )}
          </div>
          {!showNewCategory && availableCategories.length === 0 && categories.length > 0 && (
            <p className="text-sm text-amber-600 mt-1">
              Semua kategori sudah digunakan di sub-bab lain. Silakan tambah kategori baru.
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={handleNewCategoryClick}
            disabled={categoriesLoading}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        </div>
        {errors.categoryId && !showNewCategory && (
          <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>
        )}
        {showNewCategory && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
            <Input
              label="Nama Kategori Baru"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              error={errors.newCategoryName}
              required
            />
            <Textarea
              label="Deskripsi Kategori (Opsional)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              rows={2}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
                setCategorySearch("");
              }}
              className="w-full"
            >
              Batal Tambah Kategori
            </Button>
          </div>
        )}
      </div>

      <Input
        label="Urutan"
        type="number"
        value={formData.orderIndex}
        onChange={(e) => handleChange("orderIndex", e.target.value)}
        error={errors.orderIndex}
        min={0}
        required
      />

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


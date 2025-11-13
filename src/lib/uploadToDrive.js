import sharp from "sharp";

/**
 * Compress gambar ke WebP dan upload ke Google Drive via Supabase Edge Function
 * 
 * @param {File} file - File gambar yang akan di-upload
 * @param {Object} options - Opsi kompresi
 * @param {number} options.quality - Kualitas WebP (0-100, default: 80)
 * @param {number} options.maxWidth - Lebar maksimal (default: 1920)
 * @param {number} options.maxHeight - Tinggi maksimal (default: 1920)
 * @returns {Promise<Object>} Response dari Edge Function berisi link dan metadata
 */
export async function uploadImageToDrive(file, options = {}) {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1920,
  } = options;

  try {
    // Validasi file
    if (!file) {
      throw new Error("File tidak ditemukan");
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Tipe file tidak didukung. Hanya gambar yang diperbolehkan.");
    }

    // Validasi ukuran file (max 10 MB sebelum kompresi)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      throw new Error("Ukuran file melebihi 10 MB");
    }

    // Convert file ke buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Compress ke WebP dengan sharp
    const compressedBuffer = await sharp(originalBuffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    // Buat File object baru dari buffer yang sudah dikompres
    const compressedFile = new File(
      [compressedBuffer],
      file.name.replace(/\.[^/.]+$/, "") + ".webp",
      { type: "image/webp" }
    );

    // Upload ke Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL dan Anon Key harus di-set di environment variables");
    }

    const formData = new FormData();
    formData.append("file", compressedFile);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/upload-to-drive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload gagal");
    }

    const data = await response.json();

    // Return dengan informasi kompresi
    return {
      ...data,
      compressed: true,
      compressionRatio: ((1 - compressedBuffer.length / originalBuffer.length) * 100).toFixed(2),
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Upload gambar tanpa kompresi (untuk file yang sudah dikompres sebelumnya)
 * 
 * @param {File} file - File yang akan di-upload
 * @returns {Promise<Object>} Response dari Edge Function
 */
export async function uploadFileToDrive(file) {
  try {
    if (!file) {
      throw new Error("File tidak ditemukan");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL dan Anon Key harus di-set di environment variables");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/upload-to-drive`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload gagal");
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}


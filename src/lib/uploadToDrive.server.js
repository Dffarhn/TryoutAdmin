/**
 * Server-side helper untuk upload ke Google Drive
 * Gunakan ini di API routes atau Server Components
 */

import sharp from "sharp";
import { Buffer } from "buffer";
import { getSupabaseServer } from "./supabaseServer";

// Ensure Buffer is available globally for Next.js
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

/**
 * Compress gambar ke WebP dan upload ke Google Drive (Server-side)
 * 
 * @param {Buffer|File} fileInput - File atau Buffer gambar
 * @param {string} fileName - Nama file
 * @param {Object} options - Opsi kompresi
 * @returns {Promise<Object>} Response dari Edge Function
 */
export async function uploadImageToDriveServer(fileInput, fileName, options = {}) {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1920,
  } = options;

  try {
    // Convert ke buffer jika File
    let buffer;
    if (fileInput instanceof File) {
      const arrayBuffer = await fileInput.arrayBuffer();
      // Convert ArrayBuffer ke Buffer
      buffer = Buffer.from(new Uint8Array(arrayBuffer));
    } else if (Buffer.isBuffer && Buffer.isBuffer(fileInput)) {
      buffer = fileInput;
    } else if (fileInput instanceof Uint8Array) {
      buffer = Buffer.from(fileInput);
    } else {
      throw new Error("File input tidak valid");
    }

    // Compress ke WebP
    const compressedBuffer = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    // Upload ke Edge Function
    const supabase = getSupabaseServer();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL dan Anon Key harus di-set di environment variables");
    }

    const formData = new FormData();
    const blob = new Blob([compressedBuffer], { type: "image/webp" });
    formData.append("file", blob, fileName.replace(/\.[^/.]+$/, "") + ".webp");

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

    return {
      ...data,
      compressed: true,
      compressionRatio: ((1 - compressedBuffer.length / buffer.length) * 100).toFixed(2),
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}


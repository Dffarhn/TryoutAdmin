import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { uploadImageToDriveServer } from "@/lib/uploadToDrive.server";

/**
 * POST /api/upload/image
 * Upload gambar dengan kompresi WebP ke Google Drive
 * Requires admin authentication
 */
export async function POST(request) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Hanya gambar yang diperbolehkan." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (max 10 MB)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran file melebihi 10 MB" },
        { status: 400 }
      );
    }

    // Get options dari formData (optional)
    const quality = parseInt(formData.get("quality") || "80");
    const maxWidth = parseInt(formData.get("maxWidth") || "1920");
    const maxHeight = parseInt(formData.get("maxHeight") || "1920");

    // Upload dengan kompresi
    const result = await uploadImageToDriveServer(
      file,
      file.name,
      {
        quality: Math.max(1, Math.min(100, quality)),
        maxWidth: Math.max(100, Math.min(4000, maxWidth)),
        maxHeight: Math.max(100, Math.min(4000, maxHeight)),
      }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload gagal" },
      { status: 500 }
    );
  }
}


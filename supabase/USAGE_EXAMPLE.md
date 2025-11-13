# Contoh Penggunaan Upload ke Google Drive

## 📝 Integrasi dengan Question Form

Berikut contoh cara mengintegrasikan upload gambar ke form question:

### 1. Update QuestionForm Component

Tambahkan field upload gambar di `src/components/admin/QuestionForm.js`:

```javascript
"use client";

import { useState } from "react";
// ... imports lainnya

export function QuestionForm({ ... }) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialData?.link || "");

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
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
        // Gunakan publicUrl untuk disimpan ke database
        setImageUrl(data.data.publicUrl);
      } else {
        throw new Error(data.error || "Upload gagal");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload gagal: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    // ... validasi ...

    onSubmit({
      ...formData,
      link: imageUrl, // Simpan link gambar ke field 'link' di database
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ... field lainnya ... */}

      {/* Field Upload Gambar */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Gambar Soal (Opsional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">Mengupload...</p>}
        {imageUrl && (
          <div className="mt-4">
            <img
              src={imageUrl}
              alt="Preview"
              className="max-w-md rounded-lg border border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">
              Link: <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{imageUrl}</a>
            </p>
          </div>
        )}
      </div>

      {/* ... submit button ... */}
    </form>
  );
}
```

### 2. Update API Route untuk Questions

Pastikan API route `/api/questions` sudah menerima field `link` (sudah ada di kode saat ini).

### 3. Contoh Penggunaan di Client Component

```javascript
"use client";

import { useState } from "react";

export function ImageUploadExample() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quality", "80");

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        console.log("Upload berhasil:", data.data);
        // Gunakan data.data.publicUrl untuk disimpan ke database
      } else {
        throw new Error(data.error || "Upload gagal");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload gagal: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {result && (
        <div>
          <img src={result.publicUrl} alt="Uploaded" />
          <p>URL: {result.publicUrl}</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Contoh di Server Component / API Route

```javascript
import { uploadImageToDriveServer } from "@/lib/uploadToDrive.server";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  // Upload dengan kompresi
  const result = await uploadImageToDriveServer(
    file,
    file.name,
    {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1920,
    }
  );

  // result.publicUrl bisa disimpan ke database
  return NextResponse.json({ link: result.publicUrl });
}
```

## 🔧 Konfigurasi Kompresi

### Quality (Kualitas)

- **80** (default): Balance antara kualitas dan ukuran file
- **90-100**: Kualitas tinggi, file lebih besar
- **60-70**: Kualitas sedang, file lebih kecil

### Max Width/Height

- **1920x1920** (default): Cocok untuk sebagian besar use case
- **1280x1280**: Untuk file yang lebih kecil
- **2560x2560**: Untuk gambar high-res

## 📊 Response Format

Setelah upload berhasil, response akan berisi:

```json
{
  "success": true,
  "data": {
    "id": "1a2b3c4d5e6f7g8h9i0j",
    "name": "image_1234567890.webp",
    "publicUrl": "https://drive.google.com/uc?export=view&id=...",
    "directUrl": "https://drive.google.com/uc?export=download&id=...",
    "webViewLink": "https://drive.google.com/file/d/.../view",
    "webContentLink": "https://drive.google.com/uc?export=download&id=...",
    "compressed": true,
    "compressionRatio": "45.23",
    "originalSize": 2345678,
    "compressedSize": 1284567
  }
}
```

Gunakan `data.publicUrl` untuk disimpan ke field `link` di tabel `questions`.


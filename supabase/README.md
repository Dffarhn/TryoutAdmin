# Supabase Edge Functions - Upload to Google Drive

Dokumentasi untuk setup dan penggunaan Edge Function upload ke Google Drive. **Kompresi gambar dilakukan di Next.js (server-side), bukan di Edge Function.**

## 📁 Struktur Folder

```
supabase/
└── functions/
    └── upload-to-drive/
        └── index.ts
```

## 🚀 Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

Atau menggunakan npx:

```bash
npx supabase --version
```

### 2. Login ke Supabase

```bash
supabase login
```

### 3. Link Project

```bash
supabase link --project-ref <your-project-ref>
```

### 4. Setup Google Service Account

#### a. Buat Service Account di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih atau buat project baru
3. Buka **IAM & Admin** → **Service Accounts**
4. Klik **Create Service Account**
5. Isi nama dan deskripsi
6. Klik **Create and Continue**
7. Berikan role: **Editor** atau **Storage Admin**
8. Klik **Done**

#### b. Buat Key JSON

1. Klik service account yang baru dibuat
2. Buka tab **Keys**
3. Klik **Add Key** → **Create new key**
4. Pilih **JSON**
5. Download file JSON

#### c. Enable Google Drive API

1. Buka **APIs & Services** → **Library**
2. Cari "Google Drive API"
3. Klik **Enable**

#### d. Set Secret di Supabase

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat path/to/service-account.json)"
```

Atau manual via Supabase Dashboard:
- Buka **Project Settings** → **Edge Functions** → **Secrets**
- Tambahkan secret: `GOOGLE_SERVICE_ACCOUNT` dengan value JSON dari service account

## 📤 Deploy Function

### Deploy ke Production

```bash
supabase functions deploy upload-to-drive
```

### Test Lokal (Development)

```bash
supabase functions serve upload-to-drive
```

Function akan berjalan di: `http://localhost:54321/functions/v1/upload-to-drive`

## 🔧 Konfigurasi

### Environment Variables

- `GOOGLE_SERVICE_ACCOUNT` (required): JSON string dari Google Service Account credentials

### File Size Limit

Default: **10 MB** (bisa diubah di `index.ts`)

### Image Quality

Default: **80%** untuk WebP compression (dikonfigurasi di Next.js API route atau helper function)

## 📱 Penggunaan dari Next.js

### Via API Route (Recommended)

Gunakan API route `/api/upload/image` yang sudah handle kompresi:

```typescript
// Client Component
async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("quality", "80"); // optional
  formData.append("maxWidth", "1920"); // optional
  formData.append("maxHeight", "1920"); // optional

  const response = await fetch("/api/upload/image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  return data.data; // { success: true, id, publicUrl, ... }
}
```

### Via Helper Function (Server-side)

```typescript
import { uploadImageToDriveServer } from "@/lib/uploadToDrive.server";

// Di API route atau Server Component
const result = await uploadImageToDriveServer(file, fileName, {
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1920,
});
```

### Langsung ke Edge Function (Tanpa Kompresi)

```typescript
async function uploadToDrive(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-to-drive`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: formData,
    }
  );

  const data = await response.json();
  return data;
}
```

### Flutter (Dart)

```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<Map<String, dynamic>> uploadToDrive(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('https://<project-ref>.functions.supabase.co/upload-to-drive'),
  );

  // Add authorization header
  request.headers['Authorization'] = 'Bearer <your-supabase-anon-key>';
  request.headers['apikey'] = '<your-supabase-anon-key>';

  // Add file
  request.files.add(
    await http.MultipartFile.fromPath('file', imageFile.path),
  );

  // Send request
  var streamedResponse = await request.send();
  var response = await http.Response.fromStream(streamedResponse);

  return jsonDecode(response.body);
}
```

### React Native

```javascript
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

async function uploadToDrive() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'image/*',
  });

  if (result.canceled) return;

  const formData = new FormData();
  formData.append('file', {
    uri: result.assets[0].uri,
    type: result.assets[0].mimeType,
    name: result.assets[0].name,
  });

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/upload-to-drive`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: formData,
    }
  );

  return await response.json();
}
```

## 📥 Response Format

### Success Response

```json
{
  "success": true,
  "id": "1a2b3c4d5e6f7g8h9i0j",
  "name": "image_1234567890.webp",
  "webViewLink": "https://drive.google.com/file/d/.../view",
  "webContentLink": "https://drive.google.com/uc?export=download&id=...",
  "publicUrl": "https://drive.google.com/uc?export=view&id=...",
  "directUrl": "https://drive.google.com/uc?export=download&id=...",
  "thumbnailLink": "https://drive.google.com/thumbnail?id=...",
  "size": 123456,
  "originalSize": 234567,
  "compressed": true
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## 🔒 Security Notes

1. **Service Account Key**: Jangan pernah commit file JSON ke repository
2. **CORS**: Saat ini dibuka untuk semua origin (`*`). Untuk production, batasi ke domain tertentu
3. **File Validation**: Function hanya menerima file gambar dengan tipe tertentu
4. **Size Limit**: File dibatasi maksimal 10 MB untuk menghindari timeout

## 🐛 Troubleshooting

### Error: "GOOGLE_SERVICE_ACCOUNT environment variable is not set"

- Pastikan secret sudah di-set di Supabase
- Cek di Dashboard: **Project Settings** → **Edge Functions** → **Secrets**

### Error: "File size exceeds 10 MB limit"

- Kompres file terlebih dahulu sebelum upload
- Atau ubah limit di `index.ts`

### Error: "Invalid file type"

- Function hanya menerima: JPEG, JPG, PNG, WebP, GIF
- Pastikan file yang di-upload adalah gambar

### Error: "Failed to make file public"

- Ini warning, bukan error
- File masih bisa diakses via `webContentLink` atau `directUrl`

## 📚 Referensi

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Google Drive API Docs](https://developers.google.com/drive/api/v3/about-sdk)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)


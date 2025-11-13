# Upload to Google Drive Edge Function

Edge Function untuk upload gambar ke Google Drive. **Kompresi gambar dilakukan di Next.js (server-side), bukan di Edge Function ini.**

## Fitur

- ✅ Upload gambar ke Google Drive
- ✅ Validasi tipe file (hanya gambar)
- ✅ Validasi ukuran file (max 10 MB)
- ✅ Generate public URL
- ✅ CORS support
- ✅ Error handling yang lengkap

**Catatan**: File yang di-upload ke Edge Function ini sudah harus dikompres sebelumnya (biasanya di Next.js menggunakan sharp).

## Endpoint

```
POST /functions/v1/upload-to-drive
```

## Request

### Headers

```
Authorization: Bearer <supabase-anon-key>
apikey: <supabase-anon-key>
Content-Type: multipart/form-data
```

### Body

Form data dengan field `file` yang berisi file gambar.

## Response

Lihat dokumentasi di `supabase/README.md` untuk format response lengkap.

## Testing

### Menggunakan cURL

```bash
curl -X POST \
  https://<project-ref>.functions.supabase.co/upload-to-drive \
  -H "Authorization: Bearer <supabase-anon-key>" \
  -H "apikey: <supabase-anon-key>" \
  -F "file=@/path/to/image.jpg"
```

### Menggunakan Postman

1. Method: `POST`
2. URL: `https://<project-ref>.functions.supabase.co/upload-to-drive`
3. Headers:
   - `Authorization`: `Bearer <supabase-anon-key>`
   - `apikey`: `<supabase-anon-key>`
4. Body: `form-data`
   - Key: `file` (type: File)
   - Value: Pilih file gambar


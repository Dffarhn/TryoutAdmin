# Migration: Penghapusan Kolom `name` dan `description` dari Tabel `sub_chapters`

## Tanggal
Migration ini dibuat untuk menghapus kolom `name` dan `description` dari tabel `sub_chapters` karena sub-bab sekarang diidentifikasi hanya melalui kategori.

## Alasan Perubahan

### Sebelumnya
- Setiap sub-bab memiliki kolom `name` (nama sub-bab) dan `description` (deskripsi)
- Sub-bab diidentifikasi melalui nama yang unik
- Satu kategori bisa digunakan di beberapa sub-bab berbeda

### Sekarang
- Setiap kategori hanya bisa digunakan **sekali** per tryout
- Sub-bab diidentifikasi melalui `category_id` (satu kategori = satu sub-bab)
- Nama sub-bab diambil dari nama kategori (`categories.name`)
- Kolom `name` dan `description` menjadi redundan dan tidak diperlukan

## Perubahan Database

### Kolom yang Dihapus
- `name` (text NOT NULL) - Nama sub-bab
- `description` (text) - Deskripsi sub-bab

### Kolom yang Tetap Ada
- `id` (uuid) - Primary key
- `tryout_id` (uuid) - Foreign key ke tryouts
- `category_id` (uuid) - Foreign key ke categories (WAJIB, unik per tryout)
- `order_index` (integer) - Urutan sub-bab
- `created_at` (timestamp) - Waktu pembuatan

## Struktur Tabel Setelah Migration

```sql
CREATE TABLE public.sub_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tryout_id uuid NOT NULL,
  category_id uuid NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sub_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT sub_chapters_tryout_id_fkey FOREIGN KEY (tryout_id) REFERENCES public.tryouts(id),
  CONSTRAINT sub_chapters_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
```

## Perubahan Aplikasi

### 1. Form Sub-Bab (`SubChapterForm.js`)
- **Dihapus**: Field input "Nama Sub-Bab" dan "Deskripsi"
- **Tetap**: Field "Kategori" (searchable/autocomplete) dan "Urutan"
- Form sekarang lebih sederhana dan fokus pada pemilihan kategori

### 2. Validation Schema (`subChapterSchema.js`)
- **Dihapus**: Validasi untuk `name` dan `description`
- **Tetap**: Validasi untuk `orderIndex` dan `categoryId`

### 3. API Routes
Semua endpoint API untuk sub-chapters telah diupdate:
- **GET** `/api/tryouts/[id]/sub-chapters` - Tidak lagi select `name` dan `description`
- **POST** `/api/tryouts/[id]/sub-chapters` - Tidak lagi require/insert `name` dan `description`
- **GET** `/api/tryouts/[id]/sub-chapters/[subChapterId]` - Tidak lagi select `name` dan `description`
- **PATCH** `/api/tryouts/[id]/sub-chapters/[subChapterId]` - Tidak lagi update `name` dan `description`
- **DELETE** - Logging menggunakan `categoryName` bukan `name`

### 4. Display/UI
- **Tabel Sub-Bab**: Kolom "Nama" dihapus, "Kategori" menjadi kolom utama
- **Tabel Sub-Bab**: Kolom "Deskripsi" dihapus
- Semua referensi `subChapter.name` diganti dengan `subChapter.categoryName`
- Breadcrumb menggunakan `categoryName`
- Semua logging activity menggunakan `categoryName`

## Langkah-Langkah Migration

### 1. Backup Database
```sql
-- Backup tabel sub_chapters sebelum migration
CREATE TABLE sub_chapters_backup AS 
SELECT * FROM sub_chapters;
```

### 2. Verifikasi Data
Pastikan semua sub-chapters sudah memiliki `category_id`:
```sql
-- Cek apakah ada sub-chapter tanpa category_id
SELECT id, tryout_id, name, category_id 
FROM sub_chapters 
WHERE category_id IS NULL;

-- Jika ada, update terlebih dahulu atau hapus
```

### 3. Jalankan Migration
```sql
-- Hapus kolom name dan description
ALTER TABLE public.sub_chapters
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description;
```

### 4. Verifikasi Setelah Migration
```sql
-- Verifikasi struktur tabel
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sub_chapters'
ORDER BY ordinal_position;

-- Verifikasi data masih lengkap
SELECT id, tryout_id, category_id, order_index, created_at
FROM sub_chapters
LIMIT 10;
```

## Breaking Changes

### ⚠️ Perhatian
1. **API Response**: Response API tidak lagi mengembalikan field `name` dan `description`
2. **Frontend**: Semua komponen yang menggunakan `subChapter.name` harus diganti dengan `subChapter.categoryName`
3. **Data Existing**: Data `name` dan `description` yang sudah ada akan hilang setelah migration

### Migration Path untuk Data Existing
Jika ada data existing yang perlu dipertahankan:
```sql
-- Sebelum drop kolom, backup data name dan description
CREATE TABLE sub_chapters_name_backup AS
SELECT id, name, description
FROM sub_chapters;

-- Atau migrate name ke category jika diperlukan
-- (hanya jika name sama dengan category name)
```

## Rollback Plan

Jika perlu rollback, gunakan backup:

```sql
-- 1. Restore kolom (jika sudah di-drop)
ALTER TABLE public.sub_chapters
  ADD COLUMN name text,
  ADD COLUMN description text;

-- 2. Restore data dari backup
UPDATE sub_chapters sc
SET 
  name = b.name,
  description = b.description
FROM sub_chapters_backup b
WHERE sc.id = b.id;

-- 3. Set NOT NULL constraint jika diperlukan
ALTER TABLE public.sub_chapters
  ALTER COLUMN name SET NOT NULL;
```

## Testing Checklist

Setelah migration, pastikan:

- [ ] Form tambah sub-bab hanya menampilkan field Kategori dan Urutan
- [ ] Form edit sub-bab hanya menampilkan field Kategori dan Urutan
- [ ] Tabel sub-bab menampilkan kategori dengan benar
- [ ] Breadcrumb menampilkan nama kategori bukan nama sub-bab
- [ ] API GET sub-chapters mengembalikan data tanpa `name` dan `description`
- [ ] API POST sub-chapters bisa create tanpa `name` dan `description`
- [ ] API PATCH sub-chapters bisa update tanpa `name` dan `description`
- [ ] Logging activity menggunakan `categoryName`
- [ ] Filter kategori yang sudah digunakan berfungsi dengan benar

## Dampak pada Fitur Lain

### ✅ Tidak Terdampak
- Relasi dengan tabel lain (questions, tryouts) tetap sama
- Foreign key constraints tetap berfungsi
- Order index tetap berfungsi

### ⚠️ Perlu Perhatian
- Jika ada script atau tool external yang menggunakan field `name` atau `description`, perlu diupdate
- Jika ada report atau export yang menggunakan field tersebut, perlu diupdate

## Catatan Tambahan

1. **Constraint Unik**: Pertimbangkan untuk menambahkan unique constraint pada `(tryout_id, category_id)` untuk memastikan satu kategori hanya bisa digunakan sekali per tryout:
   ```sql
   ALTER TABLE public.sub_chapters
     ADD CONSTRAINT sub_chapters_tryout_category_unique 
     UNIQUE (tryout_id, category_id);
   ```

2. **Index**: Jika kolom `name` sebelumnya digunakan untuk search, pastikan search sekarang menggunakan `categories.name` melalui join.

3. **Performance**: Migration ini tidak akan mempengaruhi performa karena hanya menghapus kolom, tidak menambah join atau query yang kompleks.

## File Migration

File migration SQL tersedia di:
- `migration_remove_name_description_from_sub_chapters.sql`

## Kontak

Jika ada pertanyaan atau masalah terkait migration ini, silakan hubungi tim development.


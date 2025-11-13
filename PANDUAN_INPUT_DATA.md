# Panduan Input Data ke Database

Panduan lengkap untuk menginput data ke database aplikasi tryout sesuai dengan skema database terbaru yang mendukung sub-chapters dan many-to-many relationship.

## 📋 Daftar Isi

1. [Urutan Input Data](#urutan-input-data)
2. [Langkah 1: Input Categories](#langkah-1-input-categories)
3. [Langkah 2: Input Packages](#langkah-2-input-packages)
4. [Langkah 3: Input Tryouts](#langkah-3-input-tryouts)
5. [Langkah 4: Input Sub-Chapters](#langkah-4-input-sub-chapters)
6. [Langkah 5: Input Questions](#langkah-5-input-questions)
7. [Langkah 6: Input Answer Options](#langkah-6-input-answer-options)
8. [Langkah 7: Hubungkan Questions dengan Sub-Chapters](#langkah-7-hubungkan-questions-dengan-sub-chapters)
9. [Langkah 8: Update Correct Answer](#langkah-8-update-correct-answer)
10. [Contoh Lengkap](#contoh-lengkap)
11. [Tips dan Best Practices](#tips-dan-best-practices)

---

## Urutan Input Data

Urutan input data harus mengikuti hierarki foreign key dependencies:

```
1. Categories (independen)
2. Packages (independen)
3. Tryouts (butuh package_id saja, TIDAK perlu category_id)
4. Sub-Chapters (butuh tryout_id + category_id WAJIB)
5. Questions (bisa independen, lalu dihubungkan; category_id OPSIONAL untuk filtering)
6. Answer Options (butuh question_id)
7. Question Sub Chapters (junction table, butuh question_id + sub_chapter_id)
8. Update Questions.correct_answer_option_id (setelah answer options dibuat)
```

**PENTING**: Category sekarang ada di **Sub-Chapter**, bukan di Tryout. Ini memudahkan:
- Filtering sub-chapter berdasarkan kategori
- Filtering soal berdasarkan kategori saat selection
- Satu tryout bisa punya sub-chapter dengan kategori berbeda

---

## Langkah 1: Input Categories

Categories adalah kategori mata pelajaran (misalnya: Matematika, Fisika, Kimia).

### SQL Query:

```sql
INSERT INTO public.categories (name, description)
VALUES 
  ('Matematika', 'Kategori untuk soal-soal matematika'),
  ('Fisika', 'Kategori untuk soal-soal fisika'),
  ('Kimia', 'Kategori untuk soal-soal kimia'),
  ('Biologi', 'Kategori untuk soal-soal biologi'),
  ('Bahasa Indonesia', 'Kategori untuk soal-soal bahasa Indonesia');
```

### Catatan:
- `name` harus UNIQUE (tidak boleh duplikat)
- `description` opsional
- `id` dan `created_at` otomatis di-generate

### Query untuk melihat categories:

```sql
SELECT id, name, description, created_at 
FROM public.categories 
ORDER BY name;
```

**Simpan ID category yang dibuat** untuk digunakan di langkah berikutnya.

---

## Langkah 2: Input Packages

Packages adalah paket/edisi tryout (misalnya: Paket UTBK 2024, Paket SBMPTN 2023).

### SQL Query:

```sql
INSERT INTO public.packages (name, description, is_active)
VALUES 
  ('Paket UTBK 2024', 'Paket tryout untuk persiapan UTBK tahun 2024', true),
  ('Paket SBMPTN 2023', 'Paket tryout berdasarkan soal SBMPTN 2023', true),
  ('Paket Latihan Harian', 'Paket untuk latihan harian', true);
```

### Catatan:
- `name` harus UNIQUE
- `is_active` default `true` (false untuk nonaktifkan paket)
- `description` opsional

### Query untuk melihat packages:

```sql
SELECT id, name, description, is_active, created_at 
FROM public.packages 
WHERE is_active = true
ORDER BY created_at DESC;
```

**Simpan ID package yang dibuat** untuk digunakan di langkah berikutnya.

---

## Langkah 3: Input Tryouts

Tryouts adalah tryout spesifik yang memiliki package (TIDAK perlu category_id lagi).

### SQL Query:

```sql
INSERT INTO public.tryouts (
  package_id, 
  title, 
  description, 
  duration_minutes, 
  is_active
)
VALUES 
  (
    'package_id_dari_langkah_2',  -- Ganti dengan ID package yang sudah dibuat
    'Tryout UTBK 2024 - Set 1',
    'Tryout untuk persiapan UTBK dengan 40 soal',
    120,  -- Durasi dalam menit
    true
  );
```

### Contoh dengan nilai konkret:

```sql
-- Asumsikan:
-- Package "Paket UTBK 2024" memiliki id: 'pkg-456'

INSERT INTO public.tryouts (
  package_id, 
  title, 
  description, 
  duration_minutes, 
  is_active
)
VALUES 
  (
    'pkg-456',
    'Tryout UTBK 2024 - Set 1',
    'Tryout dengan pembahasan lengkap',
    120,
    true
  );
```

### Catatan:
- `package_id` WAJIB (NOT NULL)
- **TIDAK perlu category_id** - category akan ditentukan di sub-chapter
- `duration_minutes` dalam satuan menit
- `is_active` default `true`

### Query untuk melihat tryouts:

```sql
SELECT 
  t.id,
  t.title,
  t.description,
  t.duration_minutes,
  p.name as package_name,
  t.is_active
FROM public.tryouts t
JOIN public.packages p ON t.package_id = p.id
WHERE t.is_active = true
ORDER BY t.created_at DESC;
```

**Simpan ID tryout yang dibuat** untuk digunakan di langkah berikutnya.

---

## Langkah 4: Input Sub-Chapters

Sub-Chapters adalah sub-bab dalam tryout yang mengelompokkan soal-soal. **Setiap sub-chapter HARUS punya category**.

### SQL Query:

```sql
INSERT INTO public.sub_chapters (
  tryout_id,
  category_id,  -- WAJIB: setiap sub-chapter punya kategori
  name,
  description,
  order_index
)
VALUES 
  (
    'tryout_id_dari_langkah_3',  -- Ganti dengan ID tryout
    'category_id_dari_langkah_1',  -- WAJIB: ID category (misal: Matematika)
    'Aljabar',
    'Sub-bab tentang aljabar dasar',
    1  -- Urutan pertama
  ),
  (
    'tryout_id_dari_langkah_3',
    'category_id_dari_langkah_1',  -- Bisa category yang sama atau berbeda
    'Geometri',
    'Sub-bab tentang geometri',
    2  -- Urutan kedua
  ),
  (
    'tryout_id_dari_langkah_3',
    'category_id_fisika',  -- Bisa category berbeda (misal: Fisika)
    'Mekanika',
    'Sub-bab tentang mekanika',
    3  -- Urutan ketiga
  );
```

### Contoh dengan nilai konkret:

```sql
-- Asumsikan:
-- tryout_id: 'tryout-789'
-- Category "Matematika": 'cat-math-001'
-- Category "Fisika": 'cat-fis-001'

INSERT INTO public.sub_chapters (
  tryout_id,
  category_id,
  name,
  description,
  order_index
)
VALUES 
  ('tryout-789', 'cat-math-001', 'Aljabar', 'Sub-bab aljabar dasar', 1),
  ('tryout-789', 'cat-math-001', 'Geometri', 'Sub-bab geometri', 2),
  ('tryout-789', 'cat-fis-001', 'Mekanika', 'Sub-bab mekanika', 3);
```

### Catatan:
- `tryout_id` WAJIB
- `category_id` WAJIB - setiap sub-chapter harus punya kategori
- Satu tryout bisa punya sub-chapter dengan kategori berbeda
- `order_index` menentukan urutan tampilan (mulai dari 0 atau 1)
- `description` opsional

### Query untuk melihat sub-chapters:

```sql
SELECT 
  sc.id,
  sc.tryout_id,
  sc.category_id,
  c.name as category_name,
  sc.name,
  sc.description,
  sc.order_index,
  sc.created_at
FROM public.sub_chapters sc
JOIN public.categories c ON sc.category_id = c.id
WHERE sc.tryout_id = 'tryout_id_dari_langkah_3'
ORDER BY sc.order_index;
```

**Simpan ID sub-chapter yang dibuat** untuk digunakan di langkah 7.

---

## Langkah 5: Input Questions

Questions adalah soal-soal yang bisa reusable di multiple sub-chapters. Category di questions OPSIONAL (untuk filtering).

### SQL Query:

```sql
INSERT INTO public.questions (
  tryout_id,     -- OPSIONAL: nullable karena soal reusable
  nomor,         -- OPSIONAL: nullable karena urutan dikelola via question_sub_chapters.order_index
  category_id,   -- OPSIONAL: untuk memudahkan filtering/selection soal berdasarkan kategori
  text,
  explanation,
  link           -- OPSIONAL: untuk gambar/media
)
VALUES 
  (
    NULL,  -- Bisa NULL karena soal reusable
    NULL,  -- Bisa NULL karena urutan via junction table
    'category_id_matematika',  -- OPSIONAL: untuk filtering
    'Jika f(x) = 2x² + 3x - 5, maka nilai f(2) adalah...',
    'f(2) = 2(2)² + 3(2) - 5 = 8 + 6 - 5 = 9',
    NULL   -- Link gambar jika ada
  ),
  (
    NULL,
    NULL,
    'category_id_matematika',  -- OPSIONAL: untuk filtering
    'Nilai dari log₂ 8 adalah...',
    'log₂ 8 = log₂ 2³ = 3',
    NULL
  );
```

### Catatan:
- `tryout_id` dan `nomor` sekarang **OPSIONAL** (nullable)
- `category_id` **OPSIONAL** - bisa diisi untuk memudahkan filtering/selection soal
- Karena soal bisa reusable, kita bisa membuat soal tanpa langsung terikat ke tryout
- `link` untuk URL gambar/media (opsional)
- `correct_answer_option_id` akan di-update setelah answer options dibuat
- **Tips**: Isi `category_id` di questions untuk memudahkan pencarian soal berdasarkan kategori saat membuat tryout

### Query untuk melihat questions:

```sql
SELECT 
  q.id,
  q.tryout_id,
  q.nomor,
  q.category_id,
  c.name as category_name,
  q.text,
  q.explanation,
  q.link,
  q.created_at
FROM public.questions q
LEFT JOIN public.categories c ON q.category_id = c.id
ORDER BY q.created_at DESC;
```

**Simpan ID question yang dibuat** untuk digunakan di langkah berikutnya.

---

## Langkah 6: Input Answer Options

Answer Options adalah pilihan jawaban untuk setiap question.

### SQL Query:

```sql
INSERT INTO public.answer_options (
  question_id,
  text,
  order_index
)
VALUES 
  -- Untuk Question 1 (f(x) = 2x² + 3x - 5)
  ('question_id_1', 'A. 9', 0),
  ('question_id_1', 'B. 11', 1),
  ('question_id_1', 'C. 13', 2),
  ('question_id_1', 'D. 15', 3),
  ('question_id_1', 'E. 17', 4),
  
  -- Untuk Question 2 (log₂ 8)
  ('question_id_2', 'A. 2', 0),
  ('question_id_2', 'B. 3', 1),
  ('question_id_2', 'C. 4', 2),
  ('question_id_2', 'D. 5', 3),
  ('question_id_2', 'E. 6', 4);
```

### Catatan:
- `question_id` WAJIB
- `order_index` menentukan urutan pilihan (0=A, 1=B, 2=C, dst)
- Setiap question biasanya memiliki 4-5 pilihan jawaban

### Query untuk melihat answer options:

```sql
SELECT 
  ao.id,
  ao.question_id,
  ao.text,
  ao.order_index,
  q.text as question_text
FROM public.answer_options ao
JOIN public.questions q ON ao.question_id = q.id
WHERE ao.question_id = 'question_id_yang_dicari'
ORDER BY ao.order_index;
```

**Simpan ID answer option yang benar** untuk digunakan di langkah 8.

---

## Langkah 7: Hubungkan Questions dengan Sub-Chapters

Ini adalah langkah penting untuk many-to-many relationship. Satu soal bisa digunakan di multiple sub-chapters.

### SQL Query:

```sql
INSERT INTO public.question_sub_chapters (
  question_id,
  sub_chapter_id,
  order_index
)
VALUES 
  -- Question 1 (f(x)) di sub-chapter Aljabar (order 1)
  ('question_id_1', 'sub_chapter_id_aljabar', 1),
  
  -- Question 2 (log₂ 8) di sub-chapter Aljabar (order 2)
  ('question_id_2', 'sub_chapter_id_aljabar', 2),
  
  -- Question 1 juga bisa digunakan di sub-chapter lain (misal: Review)
  ('question_id_1', 'sub_chapter_id_review', 5);
```

### Contoh dengan nilai konkret:

```sql
-- Asumsikan:
-- question_id_1 = 'q-001'
-- question_id_2 = 'q-002'
-- sub_chapter_id_aljabar = 'sc-001'
-- sub_chapter_id_geometri = 'sc-002'

INSERT INTO public.question_sub_chapters (
  question_id,
  sub_chapter_id,
  order_index
)
VALUES 
  -- Soal di sub-chapter Aljabar
  ('q-001', 'sc-001', 1),
  ('q-002', 'sc-001', 2),
  
  -- Soal di sub-chapter Geometri
  ('q-003', 'sc-002', 1),
  ('q-004', 'sc-002', 2);
```

### Catatan:
- Constraint UNIQUE: satu question tidak bisa duplikat di sub-chapter yang sama
- `order_index` menentukan urutan soal dalam sub-chapter tersebut
- Urutan soal di aplikasi akan mengikuti `order_index` dari junction table ini

### Query untuk melihat hubungan question-sub-chapter:

```sql
SELECT 
  qsc.id,
  q.text as question_text,
  sc.name as sub_chapter_name,
  c.name as category_name,
  qsc.order_index
FROM public.question_sub_chapters qsc
JOIN public.questions q ON qsc.question_id = q.id
JOIN public.sub_chapters sc ON qsc.sub_chapter_id = sc.id
JOIN public.categories c ON sc.category_id = c.id
WHERE sc.tryout_id = 'tryout_id_yang_dicari'
ORDER BY sc.order_index, qsc.order_index;
```

---

## Langkah 8: Update Correct Answer

Setelah answer options dibuat, update field `correct_answer_option_id` di questions.

### SQL Query:

```sql
UPDATE public.questions
SET correct_answer_option_id = 'answer_option_id_yang_benar'
WHERE id = 'question_id';
```

### Contoh dengan nilai konkret:

```sql
-- Jika jawaban benar untuk question 1 adalah option dengan text "A. 9"
-- Cari dulu ID-nya:
SELECT id FROM public.answer_options 
WHERE question_id = 'q-001' AND text = 'A. 9';
-- Hasil: misalnya 'opt-001'

-- Update correct_answer_option_id:
UPDATE public.questions
SET correct_answer_option_id = 'opt-001'
WHERE id = 'q-001';
```

### Query untuk melihat questions dengan correct answer:

```sql
SELECT 
  q.id,
  q.text,
  ao.text as correct_answer,
  ao.order_index
FROM public.questions q
LEFT JOIN public.answer_options ao ON q.correct_answer_option_id = ao.id
WHERE q.id = 'question_id_yang_dicari';
```

---

## Contoh Lengkap

Berikut contoh lengkap input data untuk satu tryout:

```sql
-- ============================================
-- STEP 1: Buat Category
-- ============================================
INSERT INTO public.categories (name, description)
VALUES ('Matematika', 'Kategori matematika') RETURNING id;
-- Simpan ID: misalnya 'cat-math-001'

-- ============================================
-- STEP 2: Buat Package
-- ============================================
INSERT INTO public.packages (name, description, is_active)
VALUES ('Paket UTBK 2024', 'Paket tryout UTBK tahun 2024', true) RETURNING id;
-- Simpan ID: misalnya 'pkg-utbk-001'

-- ============================================
-- STEP 3: Buat Tryout
-- ============================================
INSERT INTO public.tryouts (
  package_id, 
  title, 
  description, 
  duration_minutes, 
  is_active
)
VALUES (
  'pkg-utbk-001',
  'Tryout UTBK 2024 - Set 1',
  'Tryout dengan 40 soal',
  120,
  true
) RETURNING id;
-- Simpan ID: misalnya 'tryout-001'
-- CATATAN: Tidak perlu category_id, category ada di sub-chapter

-- ============================================
-- STEP 4: Buat Sub-Chapters
-- ============================================
-- PENTING: Setiap sub-chapter HARUS punya category_id
INSERT INTO public.sub_chapters (tryout_id, category_id, name, description, order_index)
VALUES 
  ('tryout-001', 'cat-math-001', 'Aljabar', 'Sub-bab aljabar', 1),
  ('tryout-001', 'cat-math-001', 'Geometri', 'Sub-bab geometri', 2),
  ('tryout-001', 'cat-math-001', 'Trigonometri', 'Sub-bab trigonometri', 3)
RETURNING id;
-- Simpan ID: misalnya 'sc-alj-001', 'sc-geo-001', 'sc-trig-001'

-- ============================================
-- STEP 5: Buat Questions
-- ============================================
-- category_id OPSIONAL, tapi disarankan diisi untuk filtering
INSERT INTO public.questions (category_id, text, explanation, link)
VALUES 
  (
    'cat-math-001',  -- OPSIONAL: untuk filtering
    'Jika f(x) = 2x² + 3x - 5, maka nilai f(2) adalah...',
    'f(2) = 2(2)² + 3(2) - 5 = 8 + 6 - 5 = 9',
    NULL
  ),
  (
    'cat-math-001',  -- OPSIONAL: untuk filtering
    'Nilai dari log₂ 8 adalah...',
    'log₂ 8 = log₂ 2³ = 3',
    NULL
  )
RETURNING id;
-- Simpan ID: misalnya 'q-001', 'q-002'

-- ============================================
-- STEP 6: Buat Answer Options
-- ============================================
-- Untuk Question 1
INSERT INTO public.answer_options (question_id, text, order_index)
VALUES 
  ('q-001', 'A. 9', 0),
  ('q-001', 'B. 11', 1),
  ('q-001', 'C. 13', 2),
  ('q-001', 'D. 15', 3),
  ('q-001', 'E. 17', 4)
RETURNING id;
-- Simpan ID untuk jawaban benar: misalnya 'opt-001' (A. 9)

-- Untuk Question 2
INSERT INTO public.answer_options (question_id, text, order_index)
VALUES 
  ('q-002', 'A. 2', 0),
  ('q-002', 'B. 3', 1),
  ('q-002', 'C. 4', 2),
  ('q-002', 'D. 5', 3),
  ('q-002', 'E. 6', 4)
RETURNING id;
-- Simpan ID untuk jawaban benar: misalnya 'opt-006' (B. 3)

-- ============================================
-- STEP 7: Hubungkan Questions dengan Sub-Chapters
-- ============================================
INSERT INTO public.question_sub_chapters (question_id, sub_chapter_id, order_index)
VALUES 
  ('q-001', 'sc-alj-001', 1),  -- Question 1 di sub-chapter Aljabar, urutan 1
  ('q-002', 'sc-alj-001', 2);  -- Question 2 di sub-chapter Aljabar, urutan 2

-- ============================================
-- STEP 8: Update Correct Answer
-- ============================================
UPDATE public.questions
SET correct_answer_option_id = 'opt-001'  -- A. 9
WHERE id = 'q-001';

UPDATE public.questions
SET correct_answer_option_id = 'opt-006'  -- B. 3
WHERE id = 'q-002';
```

---

## Tips dan Best Practices

### 1. Urutan Input yang Disarankan
- Selalu buat **Categories** dan **Packages** terlebih dahulu
- Buat **Tryouts** setelah categories dan packages ready
- Buat **Sub-Chapters** setelah tryout dibuat
- Buat **Questions** bisa dilakukan kapan saja (karena reusable)
- Buat **Answer Options** setelah questions dibuat
- Hubungkan questions dengan sub-chapters via **Question Sub Chapters**
- Update **Correct Answer** di akhir

### 2. Reusable Questions
- Soal bisa dibuat tanpa `tryout_id` langsung
- Satu soal bisa digunakan di multiple sub-chapters melalui junction table
- Manfaatkan reuse untuk soal yang muncul di multiple tryout/sub-chapter

### 3. Order Index
- `sub_chapters.order_index`: Urutan sub-chapter dalam tryout (1, 2, 3, ...)
- `question_sub_chapters.order_index`: Urutan soal dalam sub-chapter (1, 2, 3, ...)
- `answer_options.order_index`: Urutan pilihan (0=A, 1=B, 2=C, 3=D, 4=E)

### 4. Best Practices
- **Gunakan transaction** untuk input data yang saling terkait:
  ```sql
  BEGIN;
  -- Insert queries here
  COMMIT;
  ```

- **Verifikasi data** setelah insert:
  ```sql
  -- Cek apakah semua data sudah terhubung dengan benar
  SELECT 
    t.title,
    sc.name as sub_chapter,
    COUNT(DISTINCT qsc.question_id) as total_questions
  FROM public.tryouts t
  JOIN public.sub_chapters sc ON t.id = sc.tryout_id
  LEFT JOIN public.question_sub_chapters qsc ON sc.id = qsc.sub_chapter_id
  GROUP BY t.id, t.title, sc.id, sc.name
  ORDER BY t.title, sc.order_index;
  ```

- **Gunakan RETURNING** untuk mendapatkan ID yang baru dibuat:
  ```sql
  INSERT INTO ... RETURNING id;
  ```

### 5. Query Helper untuk Debug

```sql
-- Cek struktur lengkap tryout
SELECT 
  t.title as tryout_title,
  p.name as package,
  sc.name as sub_chapter,
  c.name as category,
  sc.order_index as sub_chapter_order,
  q.text as question_text,
  qsc.order_index as question_order,
  COUNT(ao.id) as answer_options_count
FROM public.tryouts t
JOIN public.packages p ON t.package_id = p.id
LEFT JOIN public.sub_chapters sc ON t.id = sc.tryout_id
LEFT JOIN public.categories c ON sc.category_id = c.id
LEFT JOIN public.question_sub_chapters qsc ON sc.id = qsc.sub_chapter_id
LEFT JOIN public.questions q ON qsc.question_id = q.id
LEFT JOIN public.answer_options ao ON q.id = ao.question_id
WHERE t.id = 'tryout_id_yang_dicari'
GROUP BY t.title, p.name, sc.name, c.name, sc.order_index, q.text, qsc.order_index
ORDER BY sc.order_index, qsc.order_index;
```

### 6. Update Data

```sql
-- Update tryout
UPDATE public.tryouts
SET 
  title = 'Judul Baru',
  description = 'Deskripsi baru',
  duration_minutes = 90
WHERE id = 'tryout_id';

-- Update sub-chapter
UPDATE public.sub_chapters
SET 
  name = 'Nama Baru',
  order_index = 2
WHERE id = 'sub_chapter_id';

-- Update question
UPDATE public.questions
SET 
  text = 'Pertanyaan yang diperbarui',
  explanation = 'Pembahasan yang diperbarui'
WHERE id = 'question_id';
```

### 7. Delete Data (Hati-hati!)

```sql
-- Hapus question (akan cascade delete answer_options dan question_sub_chapters)
DELETE FROM public.questions WHERE id = 'question_id';

-- Hapus sub-chapter (akan cascade delete question_sub_chapters)
DELETE FROM public.sub_chapters WHERE id = 'sub_chapter_id';

-- Hapus tryout (akan cascade delete sub_chapters)
DELETE FROM public.tryouts WHERE id = 'tryout_id';
```

---

## Ringkasan Quick Reference

| Langkah | Table | Field Wajib | Field Opsional |
|---------|-------|------------|----------------|
| 1 | `categories` | `name` | `description` |
| 2 | `packages` | `name` | `description`, `is_active` |
| 3 | `tryouts` | `package_id`, `title`, `duration_minutes` | `description`, `is_active` |
| 4 | `sub_chapters` | `tryout_id`, `category_id`, `name` | `description`, `order_index` |
| 5 | `questions` | `text` | `tryout_id`, `nomor`, `category_id`, `explanation`, `link`, `correct_answer_option_id` |
| 6 | `answer_options` | `question_id`, `text` | `order_index` |
| 7 | `question_sub_chapters` | `question_id`, `sub_chapter_id` | `order_index` |
| 8 | `questions` (UPDATE) | - | `correct_answer_option_id` |

---

**Catatan**: Pastikan untuk menjalankan migration SQL (`migration_add_sub_chapters.sql`) terlebih dahulu sebelum mulai input data!


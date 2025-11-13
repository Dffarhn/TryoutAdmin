
## Panduan Admin Input Soal (Flutter + Supabase)

Dokumen ini merangkum cara menambahkan modul Admin untuk input bank soal (CRUD) berbasis Supabase. Termasuk referensi warna UI dan konfigurasi Supabase yang digunakan aplikasi.

### 1) Skema Database (Ringkas)
- Gunakan file yang sudah ada:
  - `DATABASE_SCHEMA.md` dan `database_schema.sql` untuk struktur tabel.
  - `database.md` untuk catatan tambahan.

Struktur umum yang disarankan:
- Tabel `subjects` (mata pelajaran)
- Tabel `questions` (soal) dengan kolom minimal: `id`, `subject_id`, `question_text`, `difficulty`, `created_by`, `created_at`
- Tabel `choices` (opsi jawaban) dengan kolom: `id`, `question_id`, `choice_text`, `is_correct`
- Opsional: `question_assets` untuk gambar/audio pendukung

Catatan: Jika sudah ada struktur di `database_schema.sql`, ikuti yang ada agar konsisten.

### 2) Konfigurasi Supabase (URL & Key)
Sumber resmi konfigurasi di kode:
- File: `lib/core/config/supabase_config.dart`
  - `supabaseUrl`: `https://ymsyfsdeuvamwgmggzhs.supabase.co`
  - `supabaseAnonKey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3lmc2RldXZhbXdnbWdnemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMTcxMTIsImV4cCI6MjA3Nzg5MzExMn0.9rJe2Fju22Vh0Yqzx1_dmq9eiH9fNMTlq-rpnfBp6bo`

Keamanan:
- Anon key bersifat publik (client-side). Untuk produksi, gunakan RLS (Row Level Security) ketat dan service role key hanya di server (jangan disimpan di aplikasi).
- Jika membagikan dokumen ini, pertimbangkan mengganti/rotasi key.

### 3) Role Admin & RLS
Disarankan menandai admin via:
- Kolom `is_admin` pada `auth.users` (profil) atau tabel `profiles` terhubung `user_id`.
- RLS contoh (konsep):
  - `questions`: hanya admin dapat INSERT/UPDATE/DELETE; semua user bisa SELECT.
  - `choices`: sama seperti `questions`.

Contoh kebijakan (arah umum, tulis di Supabase SQL editor sesuai tabel Anda):
```sql
-- Aktifkan RLS
alter table public.questions enable row level security;

-- SELECT untuk semua user login
create policy "read_questions" on public.questions
for select
to authenticated
using (true);

-- Write khusus admin (misal cek is_admin di tabel profiles)
create policy "write_questions_admin" on public.questions
for all using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.is_admin = true
  )
);
```

Lakukan hal serupa untuk tabel `choices` dan tabel terkait lainnya.

### 4) Arsitektur Modul Admin (Flutter)
- Tambahkan route/page: `features/admin/admin_dashboard.dart` (misal)
- Komponen utama:
  - Form tambah soal: subject, teks soal, tingkat kesulitan, lampiran opsional.
  - Dinamis field opsi jawaban (min 4), dengan toggle `is_correct`.
  - Daftar soal (list + pencarian + filter by subject/difficulty).
  - Aksi: buat, edit, hapus (CRUD) dengan konfirmasi.
- Validasi:
  - Minimal satu `is_correct = true`.
  - Tidak boleh semua opsi benar.
  - Teks soal dan minimal 2 opsi wajib diisi.

Integrasi Supabase (alir):
1. Insert ke `questions` → ambil `question_id` hasil insert.
2. Bulk insert `choices` terkait `question_id`.
3. Tampilkan snackbar/notifikasi sukses atau error.

### 5) Contoh Operasi Supabase (Konsep Dart)
Pseudocode Flutter (gunakan `Supabase.instance.client`):
```dart
// Insert satu soal
final insertQuestion = await supabase
  .from('questions')
  .insert({
    'subject_id': selectedSubjectId,
    'question_text': questionText,
    'difficulty': selectedDifficulty,
    'created_by': supabase.auth.currentUser!.id,
  })
  .select()
  .single();

final questionId = insertQuestion['id'];

// Siapkan choices
final choiceRows = choices.map((c) => {
  'question_id': questionId,
  'choice_text': c.text,
  'is_correct': c.isCorrect,
}).toList();

// Bulk insert choices
await supabase.from('choices').insert(choiceRows);
```

Optimasi UX:
- Gunakan loading state saat submit.
- Tampilkan error message dari Supabase (mis. validasi RLS).
- Debounce pada pencarian list soal.

### 6) Referensi Warna UI (dari `AppColors`)
Sumber: `lib/core/constants/app_colors.dart`
- Primary: `#4F46E5`
- Primary Light: `#6366F1`
- Secondary: `#22C55E`
- Accent: `#FACC15`
- Background: `#F9FAFB`
- Card Surface: `#FFFFFF`
- Text Primary: `#111827`
- Text Secondary: `#6B7280`
- Error: `#EF4444`
- Gradient Start: `#F9FAFB`
- Gradient End: `#EEF2FF`
- Google Blue: `#4285F4`

Rekomendasi pemakaian:
- Tombol utama: `primary` dengan teks putih.
- Aksi positif/sukses: `secondary`.
- Peringatan: `accent`.
- Error/validasi gagal: `error`.
- Latar app: `background`; kartu/form: `cardSurface`.

### 7) Penempatan Kode & Navigasi
- Tambah folder admin: `lib/features/admin/`
  - `admin_dashboard.dart`: daftar & filter soal
  - `question_form_page.dart`: form tambah/edit soal (+ opsi)
  - `widgets/`: komponen kecil (field opsi, selector subject, dsb.)
- Registrasi route di `lib/core/routing` (lihat struktur yang ada) agar admin dapat mengakses dari menu.
- Proteksi route admin: cek `is_admin` sebelum masuk halaman admin.

### 8) Alur Kerja Admin (Ringkas)
1. Admin login (Google/Supabase) → atribut `is_admin = true`.
2. Buka halaman Admin.
3. Pilih mata pelajaran → isi teks soal → pilih tingkat kesulitan.
4. Isi minimal 4 opsi → tandai jawaban benar.
5. Submit → insert `questions`, kemudian `choices`.
6. Soal tampil di daftar; admin bisa edit/hapus.

### 9) Testing
- Jalankan: `flutter run`
- Uji:
  - Insert soal dengan 1 jawaban benar → harus berhasil.
  - Insert soal tanpa jawaban benar → tolak dengan pesan.
  - Edit/hapus soal hanya oleh admin (uji RLS dengan user bukan admin).

### 10) Catatan Produksi
- Terapkan RLS ketat dan audit log.
- Rate limit/guard di sisi UI untuk mencegah spam.
- Pertimbangkan pagination dan index di tabel untuk performa.



# Panduan Pengguna: Sistem Subscription & Tryout

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Konsep Dasar](#konsep-dasar)
3. [Cara Kerja Sistem](#cara-kerja-sistem)
4. [Langkah-langkah Menggunakan](#langkah-langkah-menggunakan)
5. [FAQ (Pertanyaan Umum)](#faq-pertanyaan-umum)

---

## Pengenalan

Sistem Subscription & Tryout adalah fitur yang memungkinkan Anda mengakses berbagai paket tryout berdasarkan jenis subscription yang Anda miliki. Dengan sistem ini, Anda dapat:

- Berlangganan berbagai jenis paket tryout
- Mengakses tryout sesuai dengan subscription yang aktif
- Melacak progress dan hasil tryout Anda
- Mengelola subscription Anda dengan mudah

---

## Konsep Dasar

### 1. Package (Paket)
**Package** adalah kumpulan tryout yang dikelompokkan bersama. Setiap package berisi beberapa tryout yang saling terkait, misalnya:
- Package "UTBK 2024" berisi tryout TPS, TKA Saintek, dan TKA Soshum
- Package "SBMPTN" berisi berbagai tryout persiapan SBMPTN

### 2. Subscription Type (Jenis Langganan)
**Subscription Type** adalah jenis paket langganan yang tersedia. Setiap subscription type memiliki:
- **Nama**: Nama paket subscription (contoh: "Paket Bulanan", "Paket Tahunan")
- **Harga**: Biaya berlangganan
- **Durasi**: Berapa lama subscription berlaku (dalam hari)
- **Fitur**: Fitur-fitur khusus yang disertakan

Contoh Subscription Type:
- **Paket Bulanan**: Rp 150.000/bulan, akses ke semua tryout dalam package tertentu
- **Paket Tahunan**: Rp 1.500.000/tahun, akses ke semua tryout + fitur premium

### 3. User Subscription (Langganan Pengguna)
**User Subscription** adalah subscription yang Anda miliki. Ini menunjukkan:
- Subscription type mana yang Anda beli
- Kapan subscription dimulai
- Kapan subscription berakhir
- Status aktif/tidak aktif

### 4. Tryout Session (Sesi Tryout)
**Tryout Session** adalah relasi antara Package dan Subscription Type. Ini menentukan:
- Package mana yang bisa diakses dengan subscription type tertentu
- Batas waktu akses (jika ada)
- Status aktif/tidak aktif

**Contoh:**
- Package "UTBK 2024" dihubungkan dengan Subscription Type "Paket Bulanan"
- Artinya, jika Anda memiliki subscription "Paket Bulanan", Anda bisa mengakses semua tryout dalam Package "UTBK 2024"

### 5. Tryout Attempt (Percobaan Tryout)
**Tryout Attempt** adalah catatan ketika Anda mengerjakan sebuah tryout. Ini mencatat:
- Tryout mana yang Anda kerjakan
- Kapan Anda mulai dan selesai
- Skor yang Anda dapatkan
- Waktu yang digunakan
- Jumlah soal benar, salah, dan tidak dijawab

---

## Cara Kerja Sistem

### Alur Lengkap: Dari Subscription hingga Mengerjakan Tryout

```
1. Admin membuat Subscription Type
   └─> Menentukan nama, harga, durasi, dan fitur

2. Admin membuat Package
   └─> Mengelompokkan tryout-tryout terkait

3. Admin menghubungkan Package dengan Subscription Type
   └─> Membuat Tryout Session
   └─> Menentukan package mana yang bisa diakses dengan subscription tertentu

4. Anda membeli Subscription
   └─> Admin membuat Transaction (transaksi pembayaran)
   └─> Admin menandai Transaction sebagai "paid" (sudah dibayar)
   └─> Sistem otomatis membuat User Subscription untuk Anda

5. Anda melihat Tryout yang Tersedia
   └─> Sistem mengecek User Subscription Anda yang aktif
   └─> Sistem mencari Tryout Session yang sesuai dengan subscription type Anda
   └─> Sistem menampilkan semua tryout dari package yang terhubung

6. Anda mengerjakan Tryout
   └─> Sistem membuat Tryout Attempt
   └─> Mencatat semua aktivitas dan hasil Anda
```

### Diagram Alur

```
┌─────────────────┐
│ Subscription Type│
│  (Jenis Paket)   │
└────────┬─────────┘
         │
         │ dihubungkan dengan
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Tryout Session  │◄─────┤   Package    │
│  (Relasi)        │      │  (Paket)     │
└────────┬─────────┘      └──────────────┘
         │
         │ menentukan akses
         │
         ▼
┌─────────────────┐
│ User Subscription│
│ (Langganan Anda) │
└────────┬─────────┘
         │
         │ memberikan akses ke
         │
         ▼
┌─────────────────┐
│  Tryout Attempt  │
│ (Pengerjaan Anda)│
└──────────────────┘
```

---

## Langkah-langkah Menggunakan

### Langkah 1: Membeli Subscription

1. **Pilih Subscription Type yang Diinginkan**
   - Lihat daftar subscription type yang tersedia
   - Perhatikan harga, durasi, dan fitur yang disertakan
   - Pilih yang sesuai dengan kebutuhan Anda

2. **Lakukan Pembayaran**
   - Hubungi admin untuk melakukan pembayaran
   - Admin akan membuat transaksi pembayaran untuk Anda
   - Setelah pembayaran dikonfirmasi, admin akan menandai transaksi sebagai "paid"

3. **Tunggu Aktivasi**
   - Setelah admin menandai pembayaran sebagai "paid", sistem akan otomatis membuat User Subscription untuk Anda
   - Subscription Anda akan aktif dan siap digunakan

### Langkah 2: Melihat Tryout yang Tersedia

1. **Masuk ke Akun Anda**
   - Login ke aplikasi tryout
   - Pastikan Anda sudah memiliki subscription yang aktif

2. **Akses Menu Tryout**
   - Buka menu "Tryout Saya" atau "Available Tryouts"
   - Sistem akan menampilkan semua tryout yang bisa Anda akses

3. **Filter dan Pilih Tryout**
   - Tryout ditampilkan berdasarkan package yang terhubung dengan subscription type Anda
   - Setiap tryout menampilkan:
     - Nama tryout
     - Package yang memuat tryout tersebut
     - Durasi pengerjaan
     - Deskripsi tryout
     - Batas waktu akses (jika ada)

### Langkah 3: Mengerjakan Tryout

1. **Pilih Tryout**
   - Klik tryout yang ingin Anda kerjakan
   - Pastikan tryout masih dalam batas waktu akses (jika ada)

2. **Mulai Mengerjakan**
   - Klik tombol "Mulai Tryout"
   - Sistem akan mencatat waktu mulai Anda
   - Timer akan berjalan sesuai durasi tryout

3. **Jawab Soal-soal**
   - Baca setiap soal dengan teliti
   - Pilih jawaban yang menurut Anda benar
   - Anda bisa melewati soal dan kembali lagi nanti
   - Pastikan semua soal terjawab sebelum waktu habis

4. **Selesaikan Tryout**
   - Klik tombol "Selesai" atau tunggu sampai waktu habis
   - Sistem akan otomatis menghitung skor Anda
   - Hasil akan ditampilkan segera setelah selesai

### Langkah 4: Melihat Hasil dan Progress

1. **Lihat Hasil Tryout**
   - Setelah selesai, Anda akan melihat:
     - Total skor
     - Jumlah soal benar, salah, dan tidak dijawab
     - Waktu yang digunakan
     - XP yang didapat (jika ada sistem poin)

2. **Cek History**
   - Akses menu "History" atau "Riwayat Tryout"
   - Lihat semua tryout yang pernah Anda kerjakan
   - Bandingkan hasil dengan percobaan sebelumnya

3. **Pantau Subscription**
   - Cek menu "Subscription Saya"
   - Lihat kapan subscription Anda akan berakhir
   - Perpanjang subscription jika diperlukan

---

## FAQ (Pertanyaan Umum)

### Q1: Apa perbedaan antara Package dan Subscription Type?

**A:** 
- **Package** adalah kumpulan tryout yang dikelompokkan bersama (misalnya: "UTBK 2024" berisi beberapa tryout)
- **Subscription Type** adalah jenis paket langganan yang Anda beli (misalnya: "Paket Bulanan" dengan harga tertentu)
- **Tryout Session** menghubungkan keduanya: menentukan package mana yang bisa diakses dengan subscription type tertentu

### Q2: Apakah saya bisa mengakses semua tryout setelah berlangganan?

**A:** Tidak selalu. Anda hanya bisa mengakses tryout yang ada dalam package yang terhubung dengan subscription type Anda. Misalnya:
- Jika Anda berlangganan "Paket Bulanan" dan package "UTBK 2024" terhubung dengan subscription ini, Anda bisa mengakses semua tryout dalam package "UTBK 2024"
- Namun, Anda tidak bisa mengakses tryout dari package lain yang tidak terhubung dengan subscription Anda

### Q3: Apa yang terjadi jika subscription saya habis?

**A:** 
- Subscription yang habis akan otomatis menjadi tidak aktif
- Anda tidak bisa lagi mengakses tryout yang memerlukan subscription tersebut
- Namun, history dan hasil tryout yang sudah Anda kerjakan tetap tersimpan
- Untuk melanjutkan akses, Anda perlu memperpanjang atau membeli subscription baru

### Q4: Apakah ada batas waktu untuk mengerjakan tryout?

**A:** 
- **Batas waktu akses**: Beberapa tryout memiliki batas waktu kapan Anda bisa mulai mengerjakannya (ditentukan di Tryout Session). Setelah batas waktu lewat, tryout tidak bisa diakses lagi.
- **Durasi pengerjaan**: Setiap tryout memiliki durasi maksimal untuk menyelesaikannya (misalnya: 120 menit). Timer akan berjalan saat Anda mulai mengerjakan.

### Q5: Bisakah saya mengerjakan tryout yang sama lebih dari sekali?

**A:** Ya, Anda bisa mengerjakan tryout yang sama berkali-kali. Setiap percobaan akan dicatat sebagai Tryout Attempt terpisah, sehingga Anda bisa melihat progress dan perbaikan skor Anda dari waktu ke waktu.

### Q6: Bagaimana cara memperpanjang subscription?

**A:** 
1. Hubungi admin untuk melakukan pembayaran perpanjangan
2. Admin akan membuat transaksi baru
3. Setelah pembayaran dikonfirmasi, subscription Anda akan diperpanjang
4. Durasi baru akan ditambahkan ke tanggal berakhir subscription Anda

### Q7: Apa yang dimaksud dengan "Available Until" pada tryout?

**A:** "Available Until" adalah batas waktu kapan tryout tersebut bisa diakses. Setelah tanggal tersebut lewat, tryout tidak akan muncul lagi di daftar tryout yang tersedia untuk Anda, meskipun subscription Anda masih aktif.

**Contoh:**
- Tryout "UTBK Simulasi 1" memiliki "Available Until" 31 Desember 2024
- Jika subscription Anda aktif sampai Januari 2025, Anda tetap tidak bisa mengakses tryout ini setelah 31 Desember 2024

### Q8: Apakah saya bisa membatalkan subscription?

**A:** Hubungi admin untuk membatalkan subscription. Admin akan menonaktifkan subscription Anda, dan Anda tidak akan bisa mengakses tryout lagi setelah itu. Namun, history dan hasil tryout yang sudah Anda kerjakan tetap tersimpan.

### Q9: Bagaimana sistem menentukan tryout mana yang bisa saya akses?

**A:** Sistem menggunakan logika berikut:
1. Cek User Subscription Anda yang aktif (belum expired)
2. Ambil Subscription Type dari subscription aktif Anda
3. Cari Tryout Session yang terhubung dengan Subscription Type tersebut
4. Ambil Package dari Tryout Session tersebut
5. Tampilkan semua tryout yang ada dalam Package tersebut
6. Filter tryout yang masih dalam batas waktu "Available Until" (jika ada)

### Q10: Apakah ada perbedaan fitur antara subscription type yang berbeda?

**A:** Ya, setiap Subscription Type bisa memiliki fitur berbeda. Fitur-fitur ini ditentukan oleh admin saat membuat Subscription Type. Contoh fitur:
- Akses ke tryout tertentu
- Fitur analisis hasil yang lebih detail
- Prioritas support
- Dan fitur lainnya sesuai kebijakan platform

---

## Tips & Best Practices

### 1. Pilih Subscription yang Sesuai
- Pilih subscription type yang sesuai dengan kebutuhan dan budget Anda
- Pertimbangkan durasi: paket tahunan biasanya lebih hemat dibanding bulanan
- Perhatikan fitur yang disertakan

### 2. Manfaatkan Waktu dengan Baik
- Cek batas waktu akses tryout sebelum subscription Anda habis
- Prioritaskan tryout yang penting terlebih dahulu
- Gunakan fitur history untuk melacak progress

### 3. Perpanjang Tepat Waktu
- Perhatikan tanggal berakhir subscription Anda
- Perpanjang sebelum habis untuk menghindari gangguan akses
- Manfaatkan promo atau diskon jika ada

### 4. Gunakan Hasil untuk Evaluasi
- Bandingkan hasil tryout dari waktu ke waktu
- Identifikasi topik yang perlu ditingkatkan
- Gunakan data untuk fokus belajar

---

## Kontak & Bantuan

Jika Anda memiliki pertanyaan atau mengalami masalah:

1. **Hubungi Admin**
   - Admin dapat membantu dengan masalah subscription, pembayaran, dan akses tryout

2. **Cek FAQ**
   - Banyak pertanyaan umum sudah dijawab di bagian FAQ di atas

3. **Lihat History**
   - Cek history transaksi dan subscription untuk melacak aktivitas Anda

---

**Terakhir Diperbarui:** Januari 2025

**Versi:** 1.0


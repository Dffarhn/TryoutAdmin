# Dokumentasi Teknis: Sistem Subscription & Tryout Session

## Daftar Isi
1. [Overview](#overview)
2. [Struktur Database](#struktur-database)
3. [Relasi Antar Entitas](#relasi-antar-entitas)
4. [API Endpoints](#api-endpoints)
5. [Business Logic & Flow](#business-logic--flow)
6. [Migration Files](#migration-files)

---

## Overview

Sistem Subscription & Tryout Session adalah sistem yang memungkinkan pengguna untuk berlangganan berbagai jenis paket tryout. Sistem ini menghubungkan:
- **Packages** (Paket tryout) dengan **Subscription Types** (Jenis langganan)
- **User Subscriptions** (Langganan pengguna) dengan **Transactions** (Transaksi pembayaran)
- **Tryout Attempts** (Percobaan tryout) untuk tracking hasil pengerjaan

### Konsep Utama

1. **Package**: Kumpulan tryout yang dikelompokkan bersama
2. **Subscription Type**: Jenis paket langganan dengan harga dan durasi tertentu
3. **Tryout Session**: Relasi antara Package dan Subscription Type (menentukan package mana yang bisa diakses dengan subscription tertentu)
4. **Transaction**: Transaksi pembayaran untuk subscription (manual, tidak melalui payment gateway)
5. **User Subscription**: Langganan aktif pengguna yang dibuat otomatis saat transaction status menjadi 'paid'
6. **Tryout Attempt**: Catatan pengerjaan tryout oleh user

---

## Struktur Database

### 1. **subscription_types**
Jenis paket langganan yang tersedia.

**Kolom:**
- `id` (uuid, PK)
- `name` (text, UNIQUE) - Nama subscription type
- `description` (text) - Deskripsi
- `price` (numeric) - Harga subscription
- `duration_days` (integer) - Durasi dalam hari (default: 30)
- `features` (jsonb) - Fitur-fitur yang disertakan (opsional)
- `is_active` (boolean) - Status aktif/nonaktif
- `created_at`, `updated_at` (timestamp)

**Contoh Data:**
```json
{
  "id": "uuid-123",
  "name": "Paket Bulanan",
  "description": "Akses semua tryout selama 1 bulan",
  "price": 150000,
  "duration_days": 30,
  "features": {"premium_support": true, "analytics": true},
  "is_active": true
}
```

### 2. **packages**
Paket yang berisi kumpulan tryout.

**Kolom:**
- `id` (uuid, PK)
- `name` (text, UNIQUE) - Nama package
- `description` (text) - Deskripsi
- `is_active` (boolean) - Status aktif/nonaktif
- `created_at`, `updated_at` (timestamp)

**Contoh Data:**
```json
{
  "id": "uuid-456",
  "name": "UTBK 2024",
  "description": "Paket tryout persiapan UTBK 2024",
  "is_active": true
}
```

### 3. **tryout_sessions**
Relasi antara Package dan Subscription Type. Menentukan package mana yang bisa diakses dengan subscription type tertentu.

**Kolom:**
- `id` (uuid, PK)
- `package_id` (uuid, FK → packages) - Package yang dihubungkan
- `subscription_type_id` (uuid, FK → subscription_types) - Subscription type yang memberikan akses
- `available_until` (timestamp, nullable) - Batas waktu akses (opsional)
- `is_active` (boolean) - Status aktif/nonaktif
- `created_at`, `updated_at` (timestamp)

**Contoh Data:**
```json
{
  "id": "uuid-789",
  "package_id": "uuid-456",
  "subscription_type_id": "uuid-123",
  "available_until": "2025-12-31T23:59:59Z",
  "is_active": true
}
```

**Catatan Penting:**
- Satu package bisa dihubungkan ke multiple subscription types
- Satu subscription type bisa memberikan akses ke multiple packages
- `available_until` digunakan untuk membatasi waktu akses (jika null, berarti tidak ada batas waktu)

### 4. **transactions**
Transaksi pembayaran untuk subscription (manual, tidak melalui payment gateway).

**Kolom:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → user_profiles) - User yang melakukan pembayaran
- `subscription_type_id` (uuid, FK → subscription_types) - Subscription type yang dibeli
- `amount` (numeric) - Jumlah pembayaran
- `payment_method` (text, nullable) - Metode pembayaran
- `payment_status` (text) - Status: `pending`, `paid`, `failed`, `cancelled` (default: `pending`)
- `paid_at` (timestamp, nullable) - Waktu pembayaran berhasil
- `expires_at` (timestamp, nullable) - Waktu subscription berakhir (dihitung dari `paid_at` + `duration_days`)
- `metadata` (jsonb, nullable) - Data tambahan
- `created_at`, `updated_at` (timestamp)

**Flow:**
1. Admin membuat transaction dengan `payment_status = 'pending'`
2. Admin menandai transaction sebagai `paid` (update `payment_status = 'paid'` dan `paid_at`)
3. Sistem otomatis membuat `user_subscription` dengan `expires_at` berdasarkan `paid_at + duration_days`

### 5. **user_subscriptions**
Langganan aktif pengguna. Dibuat otomatis saat transaction status menjadi 'paid'.

**Kolom:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → user_profiles) - User pemilik subscription
- `subscription_type_id` (uuid, FK → subscription_types) - Tipe subscription
- `transaction_id` (uuid, FK → transactions) - Transaksi yang membayar subscription ini
- `started_at` (timestamp) - Waktu subscription mulai aktif (default: now())
- `expires_at` (timestamp) - Waktu subscription berakhir
- `is_active` (boolean) - Status aktif (true jika belum expired dan payment paid)
- `created_at`, `updated_at` (timestamp)

**Catatan:**
- Satu user bisa memiliki multiple `user_subscriptions` (riwayat)
- Hanya subscription dengan `is_active = true` dan `expires_at > now()` yang memberikan akses
- Setiap subscription terikat ke 1 transaksi

### 6. **tryout_attempts**
Catatan pengerjaan tryout oleh user.

**Kolom:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → user_profiles) - User yang mengerjakan
- `tryout_id` (uuid, FK → tryouts) - Tryout yang dikerjakan
- `started_at` (timestamp) - Waktu mulai mengerjakan
- `completed_at` (timestamp, nullable) - Waktu selesai
- `duration_minutes` (integer, nullable) - Durasi pengerjaan dalam menit
- `total_questions` (integer, nullable) - Total soal
- `correct_count` (integer) - Jumlah benar (default: 0)
- `wrong_count` (integer) - Jumlah salah (default: 0)
- `unanswered_count` (integer) - Jumlah tidak dijawab (default: 0)
- `score` (integer) - Skor yang didapat (default: 0)
- `xp_earned` (integer) - XP yang didapat (default: 0)
- `created_at` (timestamp)

**Catatan:**
- Tidak ada kolom `tryout_session_id` - attempt tidak terhubung langsung ke session
- Attempt hanya terhubung ke `tryout_id` dan `user_id`

---

## Relasi Antar Entitas

```
user_profiles (1) ──→ (N) user_subscriptions
                           │
                           ├──→ (1) subscription_types
                           │
                           └──→ (1) transactions
                                    │
                                    └──→ (1) subscription_types

subscription_types (1) ──→ (N) tryout_sessions
                                │
                                └──→ (1) packages
                                         │
                                         └──→ (N) tryouts

tryout_attempts
    ├──→ (1) user_profiles
    └──→ (1) tryouts
```

### Diagram Relasi

```
┌─────────────────┐
│ subscription_   │
│    types        │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ tryout_sessions │  │ transactions    │
└────────┬────────┘  └────────┬────────┘
         │                    │
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│ packages        │  │ user_           │
└────────┬────────┘  │ subscriptions   │
         │           └─────────────────┘
         │
         ▼
┌─────────────────┐
│ tryouts         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ tryout_attempts │
└─────────────────┘
```

---

## API Endpoints

### Subscription Types

#### `GET /api/subscription-types`
List semua subscription types.

**Query Parameters:**
- `is_active` (boolean, optional) - Filter berdasarkan status aktif

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Paket Bulanan",
      "description": "...",
      "price": 150000,
      "durationDays": 30,
      "features": {...},
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `GET /api/subscription-types/[id]`
Get single subscription type.

#### `POST /api/subscription-types`
Create subscription type baru (requires admin auth).

**Request Body:**
```json
{
  "name": "Paket Bulanan",
  "description": "...",
  "price": 150000,
  "durationDays": 30,
  "features": {...},
  "isActive": true
}
```

#### `PATCH /api/subscription-types/[id]`
Update subscription type (requires admin auth).

#### `DELETE /api/subscription-types/[id]`
Delete subscription type (requires admin auth).

---

### Transactions

#### `GET /api/transactions`
List semua transactions.

**Query Parameters:**
- `user_id` (uuid, optional) - Filter berdasarkan user
- `subscription_type_id` (uuid, optional) - Filter berdasarkan subscription type
- `payment_status` (string, optional) - Filter berdasarkan status: `pending`, `paid`, `failed`, `cancelled`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "subscriptionTypeId": "uuid",
      "subscriptionTypeName": "Paket Bulanan",
      "amount": 150000,
      "paymentMethod": "Transfer Bank",
      "paymentStatus": "paid",
      "paidAt": "2025-01-01T10:00:00Z",
      "expiresAt": "2025-01-31T10:00:00Z",
      "metadata": {...},
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `GET /api/transactions/[id]`
Get single transaction.

#### `POST /api/transactions`
Create transaction baru (requires admin auth).

**Request Body:**
```json
{
  "userId": "uuid",
  "subscriptionTypeId": "uuid",
  "amount": 150000,
  "paymentMethod": "Transfer Bank",
  "paymentStatus": "pending"
}
```

#### `PATCH /api/transactions/[id]`
Update transaction, terutama untuk mengubah `payment_status` (requires admin auth).

**Business Logic:**
- Jika `payment_status` diubah menjadi `'paid'`:
  1. Set `paid_at` = now()
  2. Hitung `expires_at` = `paid_at` + `duration_days` dari subscription_type
  3. **Otomatis create `user_subscription`** dengan:
     - `user_id` = transaction.user_id
     - `subscription_type_id` = transaction.subscription_type_id
     - `transaction_id` = transaction.id
     - `started_at` = now()
     - `expires_at` = calculated expires_at
     - `is_active` = true

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paidAt": "2025-01-01T10:00:00Z"
}
```

---

### User Subscriptions

#### `GET /api/user-subscriptions`
List semua user subscriptions.

**Query Parameters:**
- `user_id` (uuid, optional) - Filter berdasarkan user
- `subscription_type_id` (uuid, optional) - Filter berdasarkan subscription type
- `is_active` (boolean, optional) - Filter berdasarkan status aktif

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "subscriptionTypeId": "uuid",
      "subscriptionTypeName": "Paket Bulanan",
      "transactionId": "uuid",
      "startedAt": "2025-01-01T10:00:00Z",
      "expiresAt": "2025-01-31T10:00:00Z",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `GET /api/user-subscriptions/active`
Get active subscriptions untuk user tertentu.

**Query Parameters:**
- `user_id` (uuid, required) - User ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "subscriptionTypeId": "uuid",
      "subscriptionTypeName": "Paket Bulanan",
      "expiresAt": "2025-01-31T10:00:00Z",
      "isActive": true
    }
  ]
}
```

#### `GET /api/user-subscriptions/[id]`
Get single user subscription.

---

### Tryout Sessions

#### `GET /api/tryout-sessions`
List semua tryout sessions (relasi package dengan subscription type).

**Query Parameters:**
- `package_id` (uuid, optional) - Filter berdasarkan package
- `subscription_type_id` (uuid, optional) - Filter berdasarkan subscription type
- `is_active` (boolean, optional) - Filter berdasarkan status aktif

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "packageId": "uuid",
      "packageName": "UTBK 2024",
      "subscriptionTypeId": "uuid",
      "subscriptionTypeName": "Paket Bulanan",
      "availableUntil": "2025-12-31T23:59:59Z",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### `GET /api/tryout-sessions/[id]`
Get single tryout session.

#### `POST /api/tryout-sessions`
Create relasi baru antara package dengan subscription type (requires admin auth).

**Request Body:**
```json
{
  "packageId": "uuid",
  "subscriptionTypeId": "uuid",
  "availableUntil": "2025-12-31T23:59:59Z",
  "isActive": true
}
```

#### `PATCH /api/tryout-sessions/[id]`
Update tryout session (requires admin auth).

#### `DELETE /api/tryout-sessions/[id]`
Delete tryout session (requires admin auth).

#### `GET /api/tryout-sessions/user/[userId]`
Get available tryout sessions untuk user tertentu.

**Business Logic:**
1. Get active `user_subscriptions` untuk user (where `is_active = true` AND `expires_at > now()`)
2. Ambil `subscription_type_id` dari user subscriptions
3. Get `tryout_sessions` yang `subscription_type_id` ada dalam list subscription types user
4. Filter sessions yang `is_active = true` dan `available_until > now()` (jika ada)
5. Untuk setiap session, ambil semua `tryouts` dari `package_id`
6. Return flattened: satu entry per tryout

**Response:**
```json
{
  "data": [
    {
      "id": "session-uuid",
      "packageId": "uuid",
      "packageName": "UTBK 2024",
      "packageDescription": "...",
      "tryoutId": "uuid",
      "tryoutTitle": "UTBK Simulasi 1",
      "tryoutDescription": "...",
      "tryoutDurationMinutes": 120,
      "subscriptionTypeId": "uuid",
      "subscriptionTypeName": "Paket Bulanan",
      "availableUntil": "2025-12-31T23:59:59Z",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### Tryout Attempts

#### `GET /api/tryout-attempts`
List tryout attempts.

**Query Parameters:**
- `user_id` (uuid, optional) - Filter berdasarkan user
- `tryout_id` (uuid, optional) - Filter berdasarkan tryout

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "tryoutId": "uuid",
      "tryoutTitle": "UTBK Simulasi 1",
      "startedAt": "2025-01-01T10:00:00Z",
      "completedAt": "2025-01-01T12:00:00Z",
      "durationMinutes": 120,
      "totalQuestions": 50,
      "correctCount": 40,
      "wrongCount": 8,
      "unansweredCount": 2,
      "score": 80,
      "xpEarned": 100,
      "createdAt": "..."
    }
  ]
}
```

#### `GET /api/tryout-attempts/[id]`
Get single tryout attempt.

#### `POST /api/tryout-attempts`
Create tryout attempt baru.

**Request Body:**
```json
{
  "userId": "uuid",
  "tryoutId": "uuid",
  "startedAt": "2025-01-01T10:00:00Z",
  "score": 0,
  "xpEarned": 0,
  "correctCount": 0,
  "wrongCount": 0,
  "unansweredCount": 0,
  "totalQuestions": 50,
  "durationMinutes": null
}
```

#### `PATCH /api/tryout-attempts/[id]`
Update tryout attempt (untuk completion, score, dll).

**Request Body:**
```json
{
  "completedAt": "2025-01-01T12:00:00Z",
  "score": 80,
  "xpEarned": 100,
  "correctCount": 40,
  "wrongCount": 8,
  "unansweredCount": 2,
  "durationMinutes": 120
}
```

---

## Business Logic & Flow

### Flow 1: User Membeli Subscription

```
1. Admin membuat Transaction
   POST /api/transactions
   {
     "userId": "uuid",
     "subscriptionTypeId": "uuid",
     "amount": 150000,
     "paymentStatus": "pending"
   }

2. Admin menandai Transaction sebagai Paid
   PATCH /api/transactions/[id]
   {
     "paymentStatus": "paid",
     "paidAt": "2025-01-01T10:00:00Z"
   }

3. Sistem otomatis membuat User Subscription
   - expires_at = paid_at + duration_days (dari subscription_type)
   - is_active = true
   - started_at = now()

4. User sekarang memiliki akses ke tryout sesuai subscription type
```

### Flow 2: User Melihat Tryout yang Tersedia

```
1. User request available tryouts
   GET /api/tryout-sessions/user/[userId]

2. Sistem:
   a. Get active user_subscriptions untuk user
      WHERE user_id = userId
        AND is_active = true
        AND expires_at > now()
   
   b. Ambil subscription_type_id dari user subscriptions
   
   c. Get tryout_sessions
      WHERE subscription_type_id IN (list subscription types user)
        AND is_active = true
        AND (available_until IS NULL OR available_until > now())
   
   d. Untuk setiap session, ambil semua tryouts dari package
      WHERE package_id = session.package_id
   
   e. Return flattened: satu entry per tryout

3. User melihat daftar tryout yang bisa diakses
```

### Flow 3: User Mengerjakan Tryout

```
1. User memilih tryout dari daftar available tryouts

2. User mulai mengerjakan
   POST /api/tryout-attempts
   {
     "userId": "uuid",
     "tryoutId": "uuid",
     "startedAt": "2025-01-01T10:00:00Z"
   }

3. User menjawab soal-soal (dilakukan di frontend)

4. User menyelesaikan tryout
   PATCH /api/tryout-attempts/[id]
   {
     "completedAt": "2025-01-01T12:00:00Z",
     "score": 80,
     "correctCount": 40,
     "wrongCount": 8,
     "unansweredCount": 2,
     "durationMinutes": 120
   }

5. Sistem menampilkan hasil dan mencatat attempt
```

### Flow 4: Admin Mengelola Relasi Package & Subscription

```
1. Admin membuat Package (jika belum ada)
   POST /api/packages
   {
     "name": "UTBK 2024",
     "description": "..."
   }

2. Admin membuat Subscription Type (jika belum ada)
   POST /api/subscription-types
   {
     "name": "Paket Bulanan",
     "price": 150000,
     "durationDays": 30
   }

3. Admin menghubungkan Package dengan Subscription Type
   POST /api/tryout-sessions
   {
     "packageId": "uuid",
     "subscriptionTypeId": "uuid",
     "availableUntil": "2025-12-31T23:59:59Z",
     "isActive": true
   }

4. Sekarang user dengan subscription type tersebut bisa akses
   semua tryout dalam package tersebut
```

---

## Migration Files

### 1. `migration_update_tryout_attempts_session_column.sql`
**Status:** TIDAK DIGUNAKAN (karena database tidak memiliki kolom `tryout_session_id`)

File ini dibuat untuk menambahkan kolom `tryout_session_id` ke `tryout_attempts`, tapi berdasarkan struktur database final, kolom ini tidak diperlukan.

### 2. `migration_simplify_tryout_sessions.sql`
Menghapus kolom yang tidak diperlukan dari `tryout_sessions`:
- `session_type` (dihapus)
- `is_completed` (dihapus)
- `assigned_at` (dihapus)

**Struktur Final:**
- `id`, `package_id`, `subscription_type_id`, `available_until`, `is_active`, `created_at`, `updated_at`

### 3. `migration_change_tryout_sessions_to_packages.sql`
Mengubah relasi dari `tryout_id` menjadi `package_id`:
- Drop FK constraint `tryout_sessions_tryout_id_fkey`
- Rename kolom `tryout_id` → `package_id`
- Add FK constraint `tryout_sessions_package_id_fkey` → `packages(id)`

**Alasan:** Relasi seharusnya antara Package dengan Subscription Type, bukan Tryout langsung dengan Subscription Type.

---

## Catatan Penting

### 1. Payment Flow (Manual)
- **TIDAK menggunakan payment gateway**
- Admin membuat transaction dengan status `pending`
- Admin secara manual menandai transaction sebagai `paid`
- Sistem otomatis membuat `user_subscription` saat status menjadi `paid`

### 2. Tryout Sessions
- **TIDAK ada `session_type`** (progressive/batch/daily) - dihapus untuk menyederhanakan
- **TIDAK ada `is_completed`** - tidak diperlukan
- Hanya relasi sederhana: Package ↔ Subscription Type

### 3. Tryout Attempts
- **TIDAK ada kolom `tryout_session_id`**
- Attempt hanya terhubung ke `tryout_id` dan `user_id`
- Tidak ada tracking langsung ke session

### 4. Query User Available Tryouts
Query untuk mendapatkan tryout yang bisa diakses user:
1. Get active `user_subscriptions` → ambil `subscription_type_id`
2. Get `tryout_sessions` dengan `subscription_type_id` tersebut
3. Get `packages` dari `package_id` di sessions
4. Get semua `tryouts` dari packages tersebut
5. Return flattened: satu entry per tryout

### 5. Auto-create User Subscription
Saat transaction status diubah menjadi `'paid'`:
- Sistem otomatis menghitung `expires_at` = `paid_at + duration_days`
- Membuat `user_subscription` dengan data lengkap
- Set `is_active = true`

---

## Contoh Use Cases

### Use Case 1: Setup Package & Subscription

```javascript
// 1. Create Package
POST /api/packages
{
  "name": "UTBK 2024",
  "description": "Paket tryout persiapan UTBK 2024"
}

// 2. Create Subscription Type
POST /api/subscription-types
{
  "name": "Paket Bulanan",
  "price": 150000,
  "durationDays": 30
}

// 3. Link Package dengan Subscription Type
POST /api/tryout-sessions
{
  "packageId": "package-uuid",
  "subscriptionTypeId": "subscription-type-uuid",
  "isActive": true
}
```

### Use Case 2: User Membeli Subscription

```javascript
// 1. Admin create transaction
POST /api/transactions
{
  "userId": "user-uuid",
  "subscriptionTypeId": "subscription-type-uuid",
  "amount": 150000,
  "paymentStatus": "pending"
}

// 2. Admin mark as paid (auto-create user_subscription)
PATCH /api/transactions/[transaction-id]
{
  "paymentStatus": "paid",
  "paidAt": "2025-01-01T10:00:00Z"
}
```

### Use Case 3: User Mengakses Tryout

```javascript
// 1. Get available tryouts
GET /api/tryout-sessions/user/[user-id]

// Response: List tryouts yang bisa diakses berdasarkan subscription

// 2. User mulai mengerjakan
POST /api/tryout-attempts
{
  "userId": "user-uuid",
  "tryoutId": "tryout-uuid"
}

// 3. User selesai mengerjakan
PATCH /api/tryout-attempts/[attempt-id]
{
  "completedAt": "2025-01-01T12:00:00Z",
  "score": 80,
  "correctCount": 40,
  "wrongCount": 8,
  "unansweredCount": 2,
  "durationMinutes": 120
}
```

---

## Error Handling

### Common Errors

1. **Transaction sudah paid**
   - Jika transaction sudah `paid`, tidak bisa diubah lagi
   - User subscription sudah dibuat, tidak perlu dibuat lagi

2. **Subscription expired**
   - User subscription dengan `expires_at < now()` tidak memberikan akses
   - Query `user_subscriptions` harus filter `expires_at > now()`

3. **Tryout session tidak aktif**
   - Session dengan `is_active = false` tidak muncul di available tryouts
   - Session dengan `available_until < now()` tidak bisa diakses

4. **Package tidak memiliki tryout**
   - Jika package tidak memiliki tryout, session tetap dibuat tapi tidak ada tryout yang bisa diakses
   - Query user sessions akan return empty array untuk package tersebut

---

## Best Practices

1. **Transaction Management**
   - Selalu validasi `payment_status` sebelum update
   - Set `paid_at` saat mengubah status menjadi `paid`
   - Pastikan `expires_at` dihitung dengan benar

2. **User Subscription**
   - Selalu filter `is_active = true` AND `expires_at > now()` untuk active subscriptions
   - Jangan hard-delete user subscriptions, gunakan `is_active = false` untuk deactivate

3. **Tryout Sessions**
   - Gunakan `available_until` untuk membatasi waktu akses (batch/daily tryout)
   - Set `is_active = false` untuk menonaktifkan akses tanpa menghapus relasi

4. **Tryout Attempts**
   - Validasi `tryout_id` sebelum create attempt
   - Pastikan user memiliki subscription aktif sebelum mengerjakan tryout

---

**Terakhir Diperbarui:** Januari 2025

**Versi:** 1.0


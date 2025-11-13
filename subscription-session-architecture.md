# 🏗️ Arsitektur Sistem Subscription & Tryout Session

**Tanggal:** 2025-01-12  
**Versi:** Final

---

## 🎯 **Konsep Umum**

Aplikasi tryout mendukung tiga mode operasi:

* **Progressive / Paket Leveling** → urutan dari basic ke advanced, unlock paket berikutnya setelah selesai
* **Batch Nasional** → session serentak di waktu tertentu untuk semua user dengan subscription aktif
* **Daily Tryout** → session baru otomatis setiap hari untuk user dengan subscription aktif

---

## 🔄 **Alur Utama Pengguna**

1. **User registrasi / login**
2. **Pilih paket atau langganan** (subscription type)
3. **Lakukan pembayaran** → transaksi tercatat di `transactions`
4. **Sistem membuat subscription** → insert ke `user_subscriptions` dengan `is_active = true`
5. **Sistem auto-assign tryout session** → session dibuat untuk `subscription_type`, bukan langsung ke user
6. **User mengerjakan tryout** → membuat `tryout_attempts` yang terhubung ke `tryout_session_id`
7. **Jawaban tersimpan** → `user_answers` terhubung ke `attempt_id`
8. **Skor dihitung** → rekomendasi paket berikutnya muncul (untuk progressive)

---

## 📊 **Struktur Database**

### **1. subscription_types**
Master data untuk tipe-tipe langganan yang tersedia.

**Kolom Penting:**
- `id` - Primary key
- `name` - Nama subscription (UNIQUE)
- `price` - Harga (numeric(12, 2))
- `duration_days` - Durasi dalam hari (default: 30)
- `features` - JSON object untuk fitur-fitur yang didapat
- `is_active` - Status aktif/nonaktif

**Contoh Data:**
```json
{
  "name": "Premium Monthly",
  "price": 99000.00,
  "duration_days": 30,
  "features": {
    "daily_tryout": true,
    "batch_nasional": true,
    "progressive": true,
    "max_sessions": 100
  }
}
```

---

### **2. transactions**
Riwayat pembayaran user untuk subscription.

**Kolom Penting:**
- `id` - Primary key
- `user_id` - User yang melakukan pembayaran (FK → user_profiles)
- `subscription_type_id` - Tipe subscription yang dibeli (FK → subscription_types)
- `amount` - Jumlah pembayaran (numeric(12, 2))
- `payment_status` - Status: `pending`, `paid`, `failed`, `cancelled`
- `paid_at` - Waktu pembayaran berhasil
- `expires_at` - Waktu subscription berakhir

**Flow:**
1. User bayar → insert dengan `payment_status = 'pending'`
2. Payment gateway callback → update `payment_status = 'paid'` dan `paid_at`
3. Sistem create `user_subscriptions` dengan `expires_at` berdasarkan `duration_days`

---

### **3. user_subscriptions**
Relasi user dengan subscription type, menyimpan riwayat dan status langganan aktif.

**Kolom Penting:**
- `id` - Primary key
- `user_id` - User pemilik subscription (FK → user_profiles)
- `subscription_type_id` - Tipe subscription (FK → subscription_types)
- `transaction_id` - Transaksi yang membayar (FK → transactions)
- `started_at` - Waktu subscription mulai aktif
- `expires_at` - Waktu subscription berakhir
- `is_active` - Status aktif (true jika belum expired dan payment paid)

**Catatan:**
- Satu user bisa memiliki multiple `user_subscriptions` (riwayat)
- Hanya subscription dengan `is_active = true` dan `expires_at > now()` yang memberikan akses
- Setiap subscription terikat ke 1 transaksi

**Query Subscription Aktif User:**
```sql
SELECT * FROM user_subscriptions
WHERE user_id = 'user-uuid'
  AND is_active = true
  AND expires_at > now();
```

---

### **4. tryout_sessions**
Session tryout yang dibuat untuk `subscription_type` tertentu.

**Kolom Penting:**
- `id` - Primary key
- `tryout_id` - Paket soal (FK → tryouts)
- `subscription_type_id` - Subscription type yang memberikan akses (FK → subscription_types)
- `session_type` - Tipe: `progressive`, `batch_nasional`, `daily_tryout`
- `assigned_at` - Waktu session dibuat
- `available_until` - Batas waktu session tersedia (untuk daily/batch)
- `is_completed` - Status selesai (untuk progressive tracking)
- `is_active` - Status aktif/nonaktif

**Konsep Penting:**
- ❌ **TIDAK ada `user_id`** - Session dibuat untuk subscription_type, bukan langsung ke user
- ✅ User yang memiliki `subscription_type` tersebut bisa akses session ini
- ✅ Query session user dilakukan dengan join dari `user_subscriptions` berdasarkan `subscription_type_id`

**Query Session Aktif User:**
```sql
SELECT ts.*
FROM tryout_sessions ts
JOIN user_subscriptions us ON us.subscription_type_id = ts.subscription_type_id
WHERE us.user_id = 'user-uuid'
  AND us.is_active = true
  AND us.expires_at > now()
  AND ts.is_active = true
  AND (ts.available_until IS NULL OR ts.available_until > now());
```

---

### **5. tryout_attempts**
Attempt user mengerjakan tryout, terhubung ke session.

**Kolom Penting:**
- `id` - Primary key
- `user_id` - User yang mengerjakan (FK → user_profiles)
- `tryout_id` - Tryout yang dikerjakan (FK → tryouts)
- `tryout_session_id` - Session yang digunakan (FK → tryout_sessions)
- `started_at` - Waktu mulai mengerjakan
- `completed_at` - Waktu selesai
- `score` - Skor yang didapat
- `xp_earned` - XP yang didapat

**Catatan:**
- Setiap attempt terhubung ke 1 session via `tryout_session_id`
- Tracking progress per user per session

---

## 🔗 **Relasi Antar Entitas**

```
user_profiles (1) ──→ (N) user_subscriptions
                           │
                           ├──→ (N) subscription_types
                           │
                           └──→ (1) transactions
                                    │
                                    └──→ (1) subscription_types

subscription_types (1) ──→ (N) tryout_sessions
                                │
                                └──→ (1) tryouts

tryout_sessions (1) ──→ (N) tryout_attempts
                              │
                              ├──→ (1) user_profiles
                              │
                              └──→ (N) user_answers
```

---

## ⚙️ **Mekanisme Assignment**

### **Progressive**
1. User selesai mengerjakan session A
2. Update `tryout_sessions.is_completed = true` untuk session A
3. Sistem unlock session B (paket berikutnya) untuk subscription_type yang sama
4. User bisa akses session B

**Query Unlock Session Progressive:**
```sql
-- Cek apakah session sebelumnya sudah selesai
SELECT COUNT(*) FROM tryout_attempts ta
JOIN tryout_sessions ts ON ta.tryout_session_id = ts.id
WHERE ta.user_id = 'user-uuid'
  AND ts.subscription_type_id = 'subscription-type-uuid'
  AND ts.session_type = 'progressive'
  AND ta.completed_at IS NOT NULL;
```

### **Batch Nasional**
1. Admin create session dengan `session_type = 'batch_nasional'`
2. Set `available_until` untuk batas waktu
3. Semua user dengan subscription_type tersebut otomatis bisa akses
4. Query langsung dari `tryout_sessions` join `user_subscriptions`

**Create Batch Nasional:**
```sql
INSERT INTO tryout_sessions (
  tryout_id,
  subscription_type_id,
  session_type,
  available_until
) VALUES (
  'tryout-uuid',
  'subscription-type-uuid',
  'batch_nasional',
  '2025-01-15 23:59:59+00'
);
```

### **Daily Tryout**
1. Cron job berjalan setiap hari (misal jam 00:00)
2. Generate session baru untuk setiap `subscription_type` aktif
3. Set `available_until` = hari berikutnya
4. Semua user dengan subscription aktif otomatis bisa akses

**Cron Job Daily Tryout:**
```sql
-- Insert session untuk semua subscription_type aktif
INSERT INTO tryout_sessions (
  tryout_id,
  subscription_type_id,
  session_type,
  available_until
)
SELECT 
  'daily-tryout-uuid',
  st.id,
  'daily_tryout',
  now() + interval '24 hours'
FROM subscription_types st
WHERE st.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM tryout_sessions ts
    WHERE ts.subscription_type_id = st.id
      AND ts.tryout_id = 'daily-tryout-uuid'
      AND ts.session_type = 'daily_tryout'
      AND ts.created_at::date = CURRENT_DATE
  );
```

---

## 💳 **Mekanisme Subscription**

### **Flow Pembayaran:**
1. User pilih subscription type
2. Create `transactions` dengan `payment_status = 'pending'`
3. User bayar via payment gateway
4. Payment gateway callback → update `transactions.payment_status = 'paid'`
5. Sistem create `user_subscriptions` dengan:
   - `started_at` = now()
   - `expires_at` = now() + `subscription_types.duration_days`
   - `is_active` = true

### **Akses Paket:**
- Semua session aktif dari `subscription_type` otomatis bisa diakses
- Paket baru (daily tryout) otomatis ter-assign ke semua user aktif di subscription tersebut
- Saat `expires_at` habis → update `is_active = false` (via cron job atau trigger)

### **Update Status Expired:**
```sql
-- Nonaktifkan subscription yang sudah expired
UPDATE user_subscriptions
SET is_active = false,
    updated_at = now()
WHERE expires_at <= now()
  AND is_active = true;
```

---

## ✅ **Keuntungan Struktur Ini**

1. ✅ **Scalable** - Bisa handle paket satuan, langganan bulanan, dan batch nasional sekaligus
2. ✅ **Mass Assignment** - Mudah assign paket massal berdasarkan subscription type
3. ✅ **Flexible** - Support daily challenge dan progressive leveling
4. ✅ **Clean Data** - Template soal tidak duplikat per user
5. ✅ **Efficient Query** - Session dibuat sekali untuk subscription_type, bukan per user
6. ✅ **Audit Trail** - Riwayat subscription dan transaksi lengkap

---

## 📝 **Best Practices**

1. **Query Session User:**
   - Selalu join dari `user_subscriptions` berdasarkan `subscription_type_id`
   - Jangan query langsung dari `tryout_sessions` dengan user_id (karena tidak ada)

2. **Create Session:**
   - Session dibuat untuk `subscription_type_id`, bukan `user_id`
   - Set `available_until` untuk daily dan batch nasional

3. **Tracking Progress:**
   - Gunakan `tryout_attempts.tryout_session_id` untuk tracking attempt per session
   - Update `tryout_sessions.is_completed` untuk progressive tracking

4. **Subscription Management:**
   - Selalu cek `is_active` dan `expires_at` sebelum memberikan akses
   - Update `is_active = false` saat expired (via cron job)

---

**Dokumentasi ini menjelaskan arsitektur final sistem subscription dan session berdasarkan struktur database yang sudah diimplementasikan.**


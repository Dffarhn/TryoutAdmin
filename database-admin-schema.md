# Schema Database Admin & Audit Log

Dokumentasi schema untuk akun admin dan logging aktivitas admin.

## Tabel yang Dibuat

### 1. `admin_profiles`
Menyimpan informasi profil admin yang extend dari `auth.users`.

**Kolom:**
- `id` (uuid, PK) - ID profil admin
- `user_id` (uuid, FK → auth.users) - Reference ke user di auth.users
- `is_admin` (boolean) - Flag apakah user adalah admin
- `is_super_admin` (boolean) - Flag apakah user adalah super admin (bisa manage admin lain)
- `full_name` (text) - Nama lengkap admin
- `phone` (text) - Nomor telepon
- `last_login_at` (timestamp) - Terakhir login
- `created_at`, `updated_at` (timestamp) - Timestamps

**Index:**
- `idx_admin_profiles_user_id` - Index pada user_id
- `idx_admin_profiles_is_admin` - Index pada is_admin

### 2. `admin_activity_logs`
Mencatat semua aktivitas yang dilakukan admin.

**Kolom:**
- `id` (uuid, PK) - ID log
- `admin_id` (uuid, FK → admin_profiles) - Admin yang melakukan aksi
- `user_id` (uuid, FK → auth.users, nullable) - User yang terpengaruh (jika ada)
- `action_type` (text) - Jenis aksi: 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', dll
- `resource_type` (text) - Tipe resource: 'TRYOUT', 'QUESTION', 'ANSWER_OPTION', 'USER', dll
- `resource_id` (uuid, nullable) - ID resource yang diubah
- `description` (text, nullable) - Deskripsi detail aktivitas
- `metadata` (jsonb, nullable) - Data tambahan (old_values, new_values, dll)
- `ip_address` (inet, nullable) - IP address admin
- `user_agent` (text, nullable) - User agent browser
- `created_at` (timestamp) - Waktu aktivitas

**Index:**
- `idx_admin_activity_logs_admin_id` - Index pada admin_id
- `idx_admin_activity_logs_action_type` - Index pada action_type
- `idx_admin_activity_logs_resource_type` - Index pada resource_type
- `idx_admin_activity_logs_resource_id` - Index pada resource_id
- `idx_admin_activity_logs_created_at` - Index pada created_at (DESC)
- `idx_admin_activity_logs_user_id` - Index pada user_id

## Row Level Security (RLS)

### Admin Profiles
- **View**: Admin bisa melihat semua admin profiles
- **Manage**: Hanya super admin yang bisa insert/update/delete admin profiles

### Activity Logs
- **View**: Admin bisa melihat semua activity logs
- **Insert**: System bisa insert activity logs (via service role)

## Triggers

### 1. `update_admin_profiles_updated_at`
Auto-update `updated_at` saat admin_profiles diupdate.

### 2. `create_admin_profile_on_user_creation`
Auto-create `admin_profiles` saat user baru dibuat di `auth.users` (default is_admin = false).

## Helper Functions

### `is_admin(user_uuid)`
Check apakah user adalah admin.
```sql
SELECT is_admin(); -- untuk current user
SELECT is_admin('user-uuid-here'); -- untuk user tertentu
```

### `is_super_admin(user_uuid)`
Check apakah user adalah super admin.
```sql
SELECT is_super_admin();
SELECT is_super_admin('user-uuid-here');
```

### `log_admin_activity(...)`
Fungsi untuk log aktivitas admin.
```sql
SELECT log_admin_activity(
  'admin-profile-id',
  'CREATE',
  'TRYOUT',
  'tryout-uuid',
  'Membuat tryout baru',
  '{"old_values": null, "new_values": {"title": "Tryout 1"}}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
```

## Views

### `admin_activity_logs_view`
View untuk melihat aktivitas admin dengan detail admin profile.
```sql
SELECT * FROM admin_activity_logs_view 
WHERE action_type = 'CREATE' 
ORDER BY created_at DESC 
LIMIT 100;
```

## Action Types

Disarankan menggunakan action types berikut:
- `CREATE` - Membuat resource baru
- `UPDATE` - Mengupdate resource
- `DELETE` - Menghapus resource
- `VIEW` - Melihat resource
- `LOGIN` - Admin login
- `LOGOUT` - Admin logout
- `PASSWORD_CHANGE` - Admin mengubah password
- `EXPORT` - Export data
- `IMPORT` - Import data
- `BULK_UPDATE` - Update bulk

## Resource Types

Disarankan menggunakan resource types berikut:
- `TRYOUT` - Tryout
- `QUESTION` - Soal
- `ANSWER_OPTION` - Opsi jawaban
- `USER` - User
- `PACKAGE` - Paket
- `CATEGORY` - Kategori
- `ADMIN_PROFILE` - Profil admin
- `SETTINGS` - Settings

## Cara Menggunakan

### 1. Set Admin Pertama
```sql
-- Set user sebagai admin (ganti dengan user_id dari auth.users)
UPDATE public.admin_profiles
SET is_admin = true, is_super_admin = true
WHERE user_id = 'USER_ID_DARI_AUTH_USERS';
```

### 2. Log Aktivitas di API
Di Next.js API routes, gunakan fungsi `log_admin_activity`:
```javascript
// Setelah operasi berhasil
const { data: adminProfile } = await supabase
  .from('admin_profiles')
  .select('id')
  .eq('user_id', userId)
  .single();

await supabase.rpc('log_admin_activity', {
  p_admin_id: adminProfile.id,
  p_action_type: 'CREATE',
  p_resource_type: 'TRYOUT',
  p_resource_id: newTryout.id,
  p_description: 'Membuat tryout baru',
  p_metadata: { old_values: null, new_values: { title: 'Tryout 1' } }
});
```

### 3. Query Logs
```sql
-- Lihat aktivitas admin tertentu
SELECT * FROM admin_activity_logs_view 
WHERE admin_user_id = 'user-uuid' 
ORDER BY created_at DESC;

-- Lihat aktivitas pada resource tertentu
SELECT * FROM admin_activity_logs_view 
WHERE resource_type = 'TRYOUT' AND resource_id = 'tryout-uuid';

-- Lihat aktivitas hari ini
SELECT * FROM admin_activity_logs_view 
WHERE created_at >= CURRENT_DATE;
```

## Best Practices

1. **Retention Policy**: Pertimbangkan untuk archive atau hapus logs lama (misal > 1 tahun)
2. **Indexing**: Index sudah dibuat untuk query yang umum, tambahkan jika perlu
3. **Metadata**: Gunakan metadata untuk menyimpan old_values dan new_values untuk audit trail
4. **IP Address & User Agent**: Capture untuk security auditing
5. **Monitoring**: Monitor log size dan cleanup rutin
6. **Performance**: Untuk log besar, pertimbangkan partitioning atau archive strategy


# Setup Instructions

## Supabase Configuration

Credentials Supabase sudah di-hardcode di code dari `action-plan.md`:
- **URL**: `https://ymsyfsdeuvamwgmggzhs.supabase.co`
- **Anon Key**: (lihat di `src/lib/supabaseClient.js`)

Aplikasi akan otomatis menggunakan credentials ini. Tidak perlu set environment variables.

Jika ingin override dengan credentials berbeda, buat file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## Quick Start

1. **Setup Database Schema**
   ```sql
   -- Buka Supabase Dashboard → SQL Editor
   -- Jalankan: database-admin-simple.sql
   ```

2. **Create Admin First**
   - Buka: `http://localhost:3000/test/admin`
   - Isi form dan buat admin pertama

3. **Login**
   - Buka: `http://localhost:3000/admin/login`
   - Login dengan username/password yang sudah dibuat

## Database Setup

Jalankan SQL schema di Supabase:
- `database-admin-simple.sql` - Untuk admin table dan logging

## Dependencies

```bash
npm install
```

## Run Development

```bash
npm run dev
```

Aplikasi akan running di `http://localhost:3000`


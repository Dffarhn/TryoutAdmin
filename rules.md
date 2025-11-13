Satu file maksimal 300–400 baris — kalau lebih, pecah jadi komponen kecil atau hooks.

Gunakan modular structure, misal:

src/
  components/
  hooks/
  lib/
  app/ (atau pages/)
  styles/
  types/
  utils/


Jangan campur logic & UI — logic masuk ke hooks / utils, UI di komponen.

Gunakan absolute imports (@/) untuk menghindari ../../../hell.

Pisahkan business logic dari presentational component (smart vs dumb components).

⚙️ Naming & Convention

Gunakan PascalCase untuk component, camelCase untuk variabel & fungsi, UPPER_CASE untuk constants.

Nama folder & file harus deskriptif, bukan generik: useFetchUser.ts lebih baik dari hook1.ts.

Gunakan index file hanya untuk export, bukan implementasi.

Selalu beri type/interface yang jelas (Javascript wajib).

🎨 Styling & UI

Gunakan Tailwind CSS dengan konsisten — hindari inline style kecuali dynamic.

Semua warna, spacing, dll pakai design token atau config Tailwind.

Komponen UI harus reusable, hindari copy-paste styling.

Simpan animasi, icon, dan UI kecil di folder components/ui.

🧠 Logic & Hooks

Gunakan custom hooks untuk state atau side effect kompleks (useTaskCountdown, useAuth, dsb).

Setiap hook hanya punya 1 tanggung jawab jelas.

Gunakan React Query / SWR untuk data fetching, bukan useEffect langsung.

🔐 API & Data Handling

Simpan URL base API di .env dan load lewat NEXT_PUBLIC_API_URL.

Gunakan Axios instance dengan interceptor untuk handle auth dan error.

Jangan pernah expose secret key ke client side.

Validasi semua data yang masuk ke frontend (misal via Zod / Yup).

🧩 Next.js Specific

Gunakan app/ router kalau project baru (lebih modern).

Pisahkan server actions, client component, dan server component dengan jelas.

Hindari use client di semua file — pakai hanya saat butuh state / interaksi.

Gunakan dynamic import untuk komponen berat (lazy load).

Gunakan metadata API untuk SEO (title, desc, open graph, dll).


🚀 Performance & Optimization

Gunakan Image dari next/image untuk semua gambar.

Pastikan semua komponen tidak re-render berlebihan (memoize kalau perlu).

Cache API data bila memungkinkan (SWR, React Query, atau Redis).

Gunakan useCallback dan useMemo untuk handler yang sering dipassing.

Setiap ada penambahan fitur maka di buat dokumentasi nya dalam folder docs yang tersedia lebih tepat nya docs/build-feature

Setiap ada penambahan query sql maka buat pada docs/migration/feature dan buat rollback nya pada dcos/migration/rollback -> kalau bisa dengan ada nya timestamp baik nama file atau di dalam file nya
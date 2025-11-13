import { z } from "zod";

export const tryoutSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").trim(),
  description: z.string().optional(),
  durationMinutes: z.number().min(1, "Durasi minimal 1 menit").int("Durasi harus bilangan bulat"),
  isActive: z.boolean().default(true),
  packageName: z.string().min(1, "Paket wajib dipilih"),
  // categoryName dihapus - category sekarang ada di sub-chapter, bukan di tryout
});


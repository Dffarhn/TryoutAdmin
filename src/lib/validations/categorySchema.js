import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori wajib diisi")
    .max(255, "Nama kategori maksimal 255 karakter")
    .trim(),
  description: z.string().optional(),
});


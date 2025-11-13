import { z } from "zod";

export const packageSchema = z.object({
  name: z
    .string()
    .min(1, "Nama paket wajib diisi")
    .max(255, "Nama paket maksimal 255 karakter")
    .trim(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});


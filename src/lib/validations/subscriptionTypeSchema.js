import { z } from "zod";

export const subscriptionTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Nama subscription type wajib diisi")
    .max(255, "Nama subscription type maksimal 255 karakter")
    .trim(),
  description: z.string().optional(),
  price: z
    .number()
    .min(0, "Harga tidak boleh negatif")
    .or(z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) throw new Error("Harga harus berupa angka positif");
      return num;
    })),
  durationDays: z
    .number()
    .int("Durasi harus berupa bilangan bulat")
    .min(1, "Durasi minimal 1 hari")
    .or(z.string().transform((val) => {
      const num = parseInt(val);
      if (isNaN(num) || num < 1) throw new Error("Durasi harus berupa bilangan bulat positif");
      return num;
    })),
  features: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});


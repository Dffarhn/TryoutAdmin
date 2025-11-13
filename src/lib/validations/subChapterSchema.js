import { z } from "zod";

export const subChapterSchema = z.object({
  orderIndex: z.number().int("Urutan harus bilangan bulat").min(0).default(0),
  categoryId: z.string().min(1, "Kategori wajib dipilih"), // WAJIB: setiap sub-chapter harus punya kategori
});


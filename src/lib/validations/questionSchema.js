import { z } from "zod";

export const answerOptionSchema = z.object({
  text: z.string().min(1, "Teks opsi wajib diisi"),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  nomor: z.number().int("Nomor harus bilangan bulat").min(1, "Nomor minimal 1").optional(),
  categoryId: z.string().optional(), // OPSIONAL: untuk filtering
  text: z.string().min(1, "Teks soal wajib diisi").trim(),
  explanation: z.string().optional(),
  link: z.string().url("Link harus berupa URL yang valid").optional().or(z.literal("")), // OPSIONAL: link gambar
  answerOptions: z
    .array(answerOptionSchema)
    .min(2, "Minimal 2 opsi jawaban")
    .refine(
      (options) => options.some((opt) => opt.isCorrect),
      "Minimal 1 opsi harus benar"
    )
    .refine(
      (options) => options.filter((opt) => opt.isCorrect).length === 1,
      "Hanya boleh 1 opsi yang benar"
    ),
});


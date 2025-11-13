import { z } from "zod";

// Helper untuk email validation yang bisa handle empty string
const emailSchema = z
  .string()
  .trim()
  .refine(
    (val) => val === "" || z.string().email().safeParse(val).success,
    "Format email tidak valid"
  )
  .max(255, "Email maksimal 255 karakter");

// Schema untuk client-side validation (dengan confirmPassword)
export const createAdminSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username hanya boleh mengandung huruf, angka, dan underscore"
      )
      .trim(),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .max(100, "Password maksimal 100 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
    fullName: z
      .string()
      .max(255, "Nama lengkap maksimal 255 karakter")
      .trim()
      .optional(),
    email: emailSchema.optional(),
    isSuperAdmin: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

// Schema untuk API (tanpa confirmPassword)
export const createAdminApiSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh mengandung huruf, angka, dan underscore"
    )
    .trim(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter"),
  fullName: z
    .string()
    .max(255, "Nama lengkap maksimal 255 karakter")
    .trim()
    .nullable()
    .optional(),
  email: emailSchema.nullable().optional(),
  isSuperAdmin: z.boolean().default(false),
});

export const updateAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh mengandung huruf, angka, dan underscore"
    )
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  fullName: z
    .string()
    .max(255, "Nama lengkap maksimal 255 karakter")
    .trim()
    .nullable()
    .optional()
    .or(z.literal("")),
  email: emailSchema.nullable().optional().or(z.literal("")),
  isSuperAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

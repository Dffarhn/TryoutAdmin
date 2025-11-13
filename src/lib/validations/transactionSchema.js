import { z } from "zod";

export const transactionSchema = z.object({
  userId: z.string().uuid("User ID harus berupa UUID yang valid"),
  subscriptionTypeId: z.string().uuid("Subscription Type ID harus berupa UUID yang valid"),
  amount: z
    .number()
    .min(0, "Amount tidak boleh negatif")
    .or(z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) throw new Error("Amount harus berupa angka positif");
      return num;
    })),
  paymentMethod: z.string().optional().nullable(),
  paymentStatus: z.enum(["pending", "paid", "failed", "cancelled"], {
    errorMap: () => ({ message: "Payment status harus salah satu dari: pending, paid, failed, cancelled" }),
  }).default("pending"),
  metadata: z.record(z.any()).optional().nullable(),
});


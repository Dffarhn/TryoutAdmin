import { z } from "zod";

export const tryoutSessionSchema = z.object({
  packageId: z.string().uuid("Package ID harus berupa UUID yang valid"),
  subscriptionTypeId: z.string().uuid("Subscription Type ID harus berupa UUID yang valid"),
  availableUntil: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});


import { z } from "zod";

export const userObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
});

export type UserObject = z.infer<typeof userObjectSchema>;

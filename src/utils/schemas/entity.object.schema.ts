import { z } from "zod";

export const entityObjectSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
});

export type EntityObject = z.infer<typeof entityObjectSchema>;

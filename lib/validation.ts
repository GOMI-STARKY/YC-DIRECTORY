import { z } from "zod";

export const formSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  category: z.string().min(3).max(20),
  link: z.string().url("Please enter a valid image URL"),
  pitch: z.string().min(10),
});

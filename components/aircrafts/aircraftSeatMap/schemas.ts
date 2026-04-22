import { z } from "zod";

export const cabinSchema = z
  .object({
    cabinType: z.string().min(1, "Cabin type is required"),
    rowFrom: z.number().min(1, "Row From must be at least 1"),
    rowTo: z.number().min(1, "Row To must be at least 1"),
    seatFormat: z
      .string()
      .regex(/^\d+(-\d+)*$/, "Invalid format (e.g., 3-3, 2-4-2)"),
  })
  .refine((data) => data.rowTo >= data.rowFrom, {
    message: "Row To must be greater than or equal to Row From",
    path: ["rowTo"],
  });

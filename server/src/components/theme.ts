import z from "zod";

export const theme = z
  .object({
    pluginId: z.string().default("Thorium Default"),
    themeId: z.string().default("Default Theme"),
  })
  .default({});

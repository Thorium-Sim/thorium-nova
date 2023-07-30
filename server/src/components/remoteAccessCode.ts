import z from "zod";

export const remoteAccessCode = z
  .object({
    shipId: z.number().default(-1),
    clientId: z.string().default(""),
    station: z.string().nullish(),
    code: z.string().default(""),
    state: z.enum(["waiting", "accepted", "denied"]).default("waiting"),
    timestamp: z.number().default(Date.now()),
  })
  .default({});

import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getPlaiceholder } from "plaiceholder";

export const placeholderRouter = router({
  getBase64Data: publicProcedure
    .input(z.string().url().optional())
    .query(async ({ input }) => {
      if (typeof input === "string") {
        return (await getPlaiceholder(input)).base64;
      } else {
        return null;
      }
    }),
});

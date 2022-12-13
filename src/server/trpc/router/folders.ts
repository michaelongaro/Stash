import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const foldersRouter = router({
  getUserFolders: publicProcedure
    .input(z.string().nullish())
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.folder.findMany({
          where: {
            userID: input ?? "userID not found", // change later
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
  updateFolderData: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.folder.update({
          where: {
            id: input.id,
          },
          data: {
            ...input,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  createFolder: publicProcedure
    .input(
      z.object({
        userID: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const folder = await ctx.prisma.folder.create({
          data: {
            ...input,
          },
        });
        return folder;
      } catch (error) {
        console.log(error);
      }
    }),
  deleteFolder: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.folder.delete({
          where: {
            id: input.id,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});

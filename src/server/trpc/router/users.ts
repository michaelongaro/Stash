import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const usersRouter = router({
  createNewUser: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const newUser = await ctx.prisma.user.create({ data: {} });
      return newUser;
    } catch (error) {
      console.log(error);
    }
  }),
  transferLocalImagesAndFoldersToNewAccount: publicProcedure
    .input(
      z.object({
        oldID: z.string(),
        newID: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.updateMany({
          where: {
            userID: input.oldID,
          },
          data: {
            userID: input.newID,
          },
        });

        await ctx.prisma.folder.updateMany({
          where: {
            userID: input.oldID,
          },
          data: {
            userID: input.newID,
          },
        });

        // delete old user
        await ctx.prisma.user.delete({
          where: {
            id: input.oldID,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});

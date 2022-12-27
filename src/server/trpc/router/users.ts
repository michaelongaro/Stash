import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

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
  getHidePrivateImageStatus: protectedProcedure
    .input(z.string().nullish())
    .query(async ({ ctx, input }) => {
      try {
        if (!input) return true;
        const user = await ctx.prisma.user.findUnique({
          where: {
            id: input,
          },
        });
        return user?.hidePrivateImages;
      } catch (error) {
        console.log(error);
      }
    }),
  toggleHidePrivateImages: protectedProcedure
    .input(
      z.object({
        userID: z.string().nullish(),
        newValue: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.user.update({
          where: {
            id: input.userID ?? "userID not found", // change later
          },
          data: {
            hidePrivateImages: input.newValue,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});

import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const imagesRouter = router({
  createNewUser: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const newUser = await ctx.prisma.user.create({ data: {} });
      return newUser;
    } catch (error) {
      console.log(error);
    }
  }),
  getUserImages: publicProcedure
    .input(z.string().nullish())
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.image.findMany({
          where: {
            userID: input ?? "userID not found", // change later
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    }),
  // move all folder related CRUD methods to a separate folders.ts file
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
  retrieveImage: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.image.findFirst({
      where: {
        randomizedURL: input,
      },
    });
  }),
  retrieveImageFromFolder: publicProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.image.findMany({
        where: {
          folderID: input,
        },
      });
    }),
  addImage: publicProcedure
    .input(
      z.object({
        userID: z.string(),
        s3ImageURL: z.string().url(),
        randomizedURL: z.string(),
        isPublic: z.boolean(),
        title: z.string().optional().nullish(), // prisma makes optional fields null
        description: z.string().optional().nullish(),
        folderID: z.string().optional().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.create({
          data: {
            ...input,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  updateImageData: publicProcedure
    .input(
      z.object({
        id: z.string(),
        userID: z.string(),
        s3ImageURL: z.string().url(),
        randomizedURL: z.string(),
        isPublic: z.boolean().optional(),
        title: z.string().optional().nullish(),
        description: z.string().optional().nullish(),
        folderID: z.string().optional().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.update({
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
  deleteImage: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.delete({
          where: {
            id: input.id,
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
  moveSelectedImagesToFolder: publicProcedure
    .input(
      z.object({
        idsToUpdate: z.array(z.string()),
        folderID: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.updateMany({
          where: {
            id: { in: input.idsToUpdate },
          },
          data: {
            folderID: input.folderID,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
  deleteSelectedImages: publicProcedure
    .input(
      z.object({
        idsToUpdate: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.deleteMany({
          where: {
            id: { in: input.idsToUpdate },
          },
        });
      } catch (error) {
        console.log(error);
      }
    }),
});

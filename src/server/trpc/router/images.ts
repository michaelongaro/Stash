// import { User } from '@prisma/client';
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const imagesRouter = router({
  getUserImages: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.image.findMany({
        where: { userID: ctx.session.user.id },
      });
    } catch (error) {
      console.log("error", error);
    }
  }),
  // move all folder related CRUD methods to a separate folders.ts file
  getUserFolders: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.folder.findMany({
        select: {
          title: true,
          id: true,
        },
        where: { userID: ctx.session.user.id },
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
  addImage: publicProcedure
    .input(
      z.object({
        s3ImageURL: z.string().url(),
        randomizedURL: z.string(),
        isPublic: z.boolean(),
        title: z.string().optional().nullish(), // prisma makes optional fields null
        description: z.string().optional().nullish(),
        userID: z.string().optional().nullish(),
        folderID: z.string().optional().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.image.create({
          data: {
            s3ImageURL: input.s3ImageURL,
            randomizedURL: input.randomizedURL,
            title: input.title,
            description: input.description,
            folderID: input.folderID,
            userID: input.userID,
            isPublic: input.isPublic,
          },
        });
        // }
      } catch (error) {
        console.log(error);
      }
    }),
  updateImageData: publicProcedure
    .input(
      z.object({
        id: z.string(),
        s3ImageURL: z.string().url(),
        randomizedURL: z.string(),
        isPublic: z.boolean(),
        title: z.string().optional().nullish(),
        description: z.string().optional().nullish(),
        userID: z.string().optional().nullish(),
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
            title: input.title,
            description: input.description,
            isPublic: input.isPublic,
            folderID: input.folderID,
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
            title: input.title,
            description: input.description,
            userID: input.userID,
          },
        });
        return folder;
      } catch (error) {
        console.log(error);
      }
    }),
});

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
        title: z.string(),
        description: z.string(),
        isPublic: z.boolean(),
        userID: z.string(),
        folderID: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // refactor later, probably split into two mutate functions
        // where one is public and other is a privateProcedure

        if (input.folderID !== "changeThisLater") {
          await ctx.prisma.image.create({
            data: {
              s3ImageURL: input.s3ImageURL,
              randomizedURL: input.randomizedURL,
              title: input.title,
              description: input.description,
              isPublic: input.isPublic,
              userID: input.userID,
              folderID: input.folderID,
            },
          });
        } else {
          await ctx.prisma.image.create({
            data: {
              s3ImageURL: input.s3ImageURL,
              randomizedURL: input.randomizedURL,
              title: input.title,
              description: input.description,
              userID: input.userID,
              isPublic: input.isPublic,
            },
          });
        }
      } catch (error) {
        console.log(error);
      }
    }),
  createFolder: publicProcedure
    .input(
      z.object({
        title: z.string(),
        // description: z.string(),
        userID: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const b = await ctx.prisma.folder.create({
          data: {
            title: input.title,
            // description: input.description,
            userID: input.userID,
          },
        });
        console.log("b:", b);
      } catch (error) {
        console.log(error);
      }
    }),
});

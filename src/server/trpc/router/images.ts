import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getPlaiceholder } from "plaiceholder";

export const imagesRouter = router({
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
        const base64ImageData = (
          await getPlaiceholder(input.s3ImageURL, {
            size: 10,
          })
        ).base64;

        await ctx.prisma.image.create({
          data: {
            ...input,
            blurredImageData: base64ImageData,
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
  moveSelectedImagesToFolder: publicProcedure
    .input(
      z.object({
        idsToUpdate: z.array(z.string()),
        folderID: z.string().nullish().optional(),
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

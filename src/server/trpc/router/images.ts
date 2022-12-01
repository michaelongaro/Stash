import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

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
            userID: ctx.session?.user?.id ?? input ?? "userID not found", // change later
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
          select: {
            title: true,
            id: true,
          },
          where: {
            userID: ctx.session?.user?.id ?? input ?? "userID not found", // change later
          }, // FIRST, find way to test this
          // SECOND, need to add localStorage.get("userID") to all
          // occurances of session.user.id basically
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
  transferUnregisteredUserDataToRealUserData: publicProcedure
    .input(
      z.object({
        id: z.string(),
        newlyAddedUserData: z.object({
          id: z.string(),
          image: z.string().optional().nullish(),
          name: z.string().optional().nullish(),
          email: z.string().email().optional().nullish(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // copying over all data from newly signed in user besides its cuid

        console.log("user data was:", ctx.session?.user, input);

        const user = await ctx.prisma.user.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.newlyAddedUserData.name ?? "name",
            email: input.newlyAddedUserData.email ?? "email",
            image: input.newlyAddedUserData.image ?? "image",
          },
        });

        // seems like a Prisma bug where regular update wouldn't work
        const session = await ctx.prisma.session.updateMany({
          where: {
            userId: input.newlyAddedUserData.id,
          },
          data: {
            userId: input.id ?? "idz",
          },
        });

        // seems like a Prisma bug where regular update wouldn't work
        const account = await ctx.prisma.account.updateMany({
          where: {
            userId: input.newlyAddedUserData.id,
          },
          data: {
            userId: input.id ?? "idz",
          },
        });

        return { user: user, session: session, account: account };
      } catch (error) {
        console.log(error);
      }
      return "found NOTHING";
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
});

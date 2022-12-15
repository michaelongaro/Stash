import { router, publicProcedure } from "../trpc";

export const metadataRouter = router({
  getAWSS3SecretKeys: publicProcedure.query(() => {
    return {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };
  }),
});

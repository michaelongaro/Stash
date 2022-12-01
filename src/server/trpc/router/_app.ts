import { router } from "../trpc";
import { imagesRouter } from "./images";

export const appRouter = router({
  images: imagesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

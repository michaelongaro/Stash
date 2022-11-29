import { router } from "../trpc";
// import { authRouter } from "./auth";
import { imagesRouter } from "./images";

export const appRouter = router({
  images: imagesRouter,
  // auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

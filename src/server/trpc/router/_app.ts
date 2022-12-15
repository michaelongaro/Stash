import { router } from "../trpc";
import { foldersRouter } from "./folders";
import { imagesRouter } from "./images";
import { usersRouter } from "./users";
import { metadataRouter } from "./metadata";

export const appRouter = router({
  images: imagesRouter,
  users: usersRouter,
  folders: foldersRouter,
  metadataRouter: metadataRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

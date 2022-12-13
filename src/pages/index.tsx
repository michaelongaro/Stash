import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

import HomePage from "../components/HomePage";
import ImageLibrary from "../components/ImageLibrary/ImageLibrary";
import { trpc } from "../utils/trpc";
import { ToastContainer } from "react-toastify";
import { useLocalStorageContext } from "../context/LocalStorageContext";

const Home = () => {
  // def don't have to do, but could just have like a whole page spinner (component?)
  // render out while status === loading

  // ^^^^^ probably should do this

  const localStorageID = useLocalStorageContext();

  const { data: session, status } = useSession();
  const { data: images, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(
      localStorageID?.value ?? session?.user?.id
    );
  const utils = trpc.useContext();

  const transferImagesAndFolders =
    trpc.users.transferLocalImagesAndFoldersToNewAccount.useMutation({
      onMutate: () => {
        utils.images.getUserImages.cancel();
        const optimisticUpdate = utils.images.getUserImages.getData();

        if (optimisticUpdate) {
          utils.images.getUserImages.setData(optimisticUpdate);
        }
      },
      onSuccess: () => {
        localStorage.removeItem("userID");
        localStorageID?.setValue(null);
      },
      onSettled: () => {
        utils.images.getUserImages.invalidate();
      },
    });

  // completes transfer of unregistered user information to
  // new signed in user account in db
  useEffect(() => {
    if (session?.user?.id && localStorageID?.value) {
      transferImagesAndFolders.mutate({
        oldID: localStorageID?.value,
        newID: session.user.id,
      });
    }
  }, [session, localStorageID?.value]);

  if (status === "loading") {
    // return <main className="flex flex-col items-center pt-4">Loading...</main>;
    return <></>;
  }

  return (
    <>
      <Head>
        <title>Stash</title>
        <meta
          property="og:title"
          content="Store all of your images for free with Stash, an image editing, hosting and sharing website."
          key="title"
        />
        <meta name="theme-color" content="rgb(37 99 235)" />
      </Head>
      {session || localStorageID?.value ? <ImageLibrary /> : <HomePage />}
      <ToastContainer limit={3} />
    </>
  );
};

export default Home;

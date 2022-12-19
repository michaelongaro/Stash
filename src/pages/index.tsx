import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";

import HomePage from "../components/HomePage/HomePage";
import ImageLibrary from "../components/ImageLibrary/ImageLibrary";
import { trpc } from "../utils/trpc";
import { ToastContainer } from "react-toastify";
import { useLocalStorageContext } from "../context/LocalStorageContext";

const Home = () => {
  const { data: session, status } = useSession();
  const utils = trpc.useContext();
  const localStorageID = useLocalStorageContext();

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
    return <></>;
  }

  return (
    <>
      <Head>
        <title>Stash</title>
        <meta
          name="description"
          content="Store all of your images for free with Stash, an image editing, hosting and sharing website."
        />
        <meta name="theme-color" content="rgb(37 99 235)" />
      </Head>
      {session || localStorageID?.value ? <ImageLibrary /> : <HomePage />}
      <ToastContainer limit={3} />
    </>
  );
};

export default Home;

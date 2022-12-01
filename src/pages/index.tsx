import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import HomePage from "../components/HomePage";
import ImageLibrary from "../components/ImageLibrary/ImageLibrary";
import { trpc } from "../utils/trpc";

const Home = () => {
  // def don't have to do, but could just have like a whole page spinner (component?)
  // render out while status === loading

  const [localStorageUserID, setLocalStorageUserID] = useState<string | null>(
    null
  );

  useEffect(() => {
    setLocalStorageUserID(localStorage.getItem("userID"));
  }, []);

  const { data: session, status } = useSession();
  const { data: images, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(localStorageUserID); // maybe want to check if status === "loading" and if so just do "" idk
  const utils = trpc.useContext();

  const transferUnregisteredUserDataToRealUserData =
    trpc.images.transferUnregisteredUserDataToRealUserData.useMutation({
      onMutate: () => {
        utils.images.getUserImages.cancel();
        const optimisticUpdate = utils.images.getUserImages.getData();

        if (optimisticUpdate) {
          utils.images.getUserImages.setData(optimisticUpdate);
        }
      },
      onSuccess: (data) => {
        // delete newly created user from db here
        console.log("data returned", data);

        localStorage.removeItem("userID");
        setLocalStorageUserID(null);
      },
      onSettled: () => {
        utils.images.getUserImages.invalidate();
      },
    });

  // completes transfer of unregistered user information to
  // new signed in user account in db
  useEffect(() => {
    if (
      session?.user?.id &&
      localStorageUserID &&
      images &&
      images.length === 0
    ) {
      console.log(
        "moving forward because",
        session?.user?.id,
        localStorageUserID,
        images,
        images.length
      );

      transferUnregisteredUserDataToRealUserData.mutate({
        id: localStorageUserID,
        newlyAddedUserData: session.user,
      });
    }
  }, [session, localStorageUserID, images]);

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <>
      {session || localStorage.getItem("userID") ? (
        <ImageLibrary />
      ) : (
        <HomePage />
      )}
    </>
  );
};

export default Home;

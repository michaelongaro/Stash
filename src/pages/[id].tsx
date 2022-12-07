import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";
import { FaLock } from "react-icons/fa";

function SharedImage() {
  const router = useRouter();
  const { data: session } = useSession();

  // janky, should change somehow
  let queryID = undefined;
  if (router?.query?.id && typeof router?.query?.id === "string") {
    queryID = router.query.id;
  }
  const userQuery = trpc.images.retrieveImage.useQuery(queryID ?? "nothing");
  const [unauthorizedToViewImage, setUnauthorizedToViewImage] =
    useState<boolean>(false);

  useEffect(() => {
    if (userQuery?.data) {
      if (
        !userQuery?.data?.isPublic &&
        userQuery?.data?.userID !== session?.user?.id
      ) {
        setUnauthorizedToViewImage(true);
      }
    }
  }, [userQuery]);

  return (
    <div className="flex h-[100vh] items-center justify-center">
      {userQuery && !unauthorizedToViewImage && (
        <img
          className="shadow-xl"
          src={userQuery.data?.s3ImageURL}
          alt={userQuery.data?.title ?? "image retrieved from AWS s3 database"}
        />
      )}

      {unauthorizedToViewImage && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-slate-200 p-4 text-3xl text-blue-700">
          <FaLock size={"2rem"} />
          You do not have access to view this image.
        </div>
      )}
    </div>
  );
}

export default SharedImage;

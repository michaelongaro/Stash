import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";
import { FaLock } from "react-icons/fa";
import Image from "next/image";
import LogIn from "../components/auth/LogIn";
import base64Logo from "../utils/base64Logo";

function SharedImage() {
  const router = useRouter();
  const { data: session } = useSession();

  let queryID = undefined;
  if (router?.query?.id && typeof router?.query?.id === "string") {
    queryID = router.query.id;
  }

  const userQuery = trpc.images.retrieveImage.useQuery(queryID ?? "");
  const { data: placeholder } = trpc.placeholderRouter.getBase64Data.useQuery(
    userQuery.data?.s3ImageURL
  );
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
  }, [session, userQuery]);

  return (
    <div className="flex h-[100vh] items-center justify-center">
      {userQuery.data && !unauthorizedToViewImage && (
        <div className="max-h-[99vh]">
          <Image
            className="!relative max-h-[95vh] max-w-[95vw] rounded-md shadow-xl"
            src={userQuery.data.s3ImageURL}
            alt={userQuery.data.title ?? "image retrieved from AWS s3 database"}
            fill={true}
            quality={100}
            priority={true}
            placeholder={"blur"}
            blurDataURL={placeholder ?? base64Logo}
          />
        </div>
      )}

      {unauthorizedToViewImage && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-slate-200 p-4 text-xl text-blue-700">
          <FaLock size={"2rem"} />
          You do not have access to view this image.
          <LogIn gap={"1.5rem"} />
        </div>
      )}
    </div>
  );
}

export default SharedImage;

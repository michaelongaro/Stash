import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";

function SharedImage() {
  const router = useRouter();
  const { data: session } = useSession();

  // janky, should change somehow
  let queryID = undefined;
  if (router?.query?.id && typeof router?.query?.id === "string") {
    queryID = router.query.id;
  }
  const userQuery = trpc.images.retrieveImage.useQuery(queryID ?? "nothing");
  let unauthorizedToViewImage = false;

  if (userQuery?.data) {
    if (
      userQuery?.data?.isPublic &&
      userQuery?.data?.userID !== session?.user?.id
    ) {
      unauthorizedToViewImage = true;
    }
  }

  return (
    <>
      {userQuery && (
        <img
          className="m-auto h-[100vh]"
          src={userQuery.data?.s3ImageURL}
          alt={userQuery.data?.title ?? "image retrieved from aws s3 database"}
        />
      )}

      {unauthorizedToViewImage && (
        <div>You do not have access to view this image.</div>
      )}
    </>
  );
}

export default SharedImage;

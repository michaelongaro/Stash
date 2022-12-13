import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { trpc } from "../utils/trpc";
import { useSession } from "next-auth/react";
import { FaLock } from "react-icons/fa";
import Image from "next/image";
import LogIn from "../components/auth/LogIn";

function SharedImage() {
  const router = useRouter();
  const { data: session } = useSession();

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
            blurDataURL={
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjQxMyIgdmlld0JveD0iMCAwIDM5MCA0MTMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSIjMUUxRTFFIi8+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSJ3aGl0ZSIvPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPgo8cGF0aCBkPSJNMTMwLjUgMjY1TDE2Mi41IDE5OS4yNUwxOTQuNSAxMzMuNUwyNTkuNSAyNjUiIHN0cm9rZT0iIzFENEVEOCIgc3Ryb2tlLXdpZHRoPSIyNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjExMy45OTciIHk9IjEyMSIgd2lkdGg9IjE2Mi4wMDYiIGhlaWdodD0iMTY0LjUwMyIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSI0Ii8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjIiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMF8xIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzBfMSIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPC9kZWZzPgo8L3N2Zz4K"
            }
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

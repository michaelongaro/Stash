import React from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";

function Images() {
  // should eventually use status to show something while fetching whether user
  // is logged in or not
  const { data: session, status } = useSession();

  const { data: images, isLoading } = trpc.images.getUserImages.useQuery();

  if (isLoading) return <div>Fetching images...</div>;

  return (
    <div>
      {images?.map((image) => {
        return (
          <div key={image.id}>
            {/* make this a component */}
            <img
              src={image.s3ImageURL}
              alt={image?.title ?? "uploaded image"}
            />
          </div>
        );
      })}
    </div>
  );
}

export default Images;

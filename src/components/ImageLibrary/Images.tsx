import React, { useState } from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import UploadedImage from "./UploadedImage";
import { type Image } from "@prisma/client";
import EditImageModal from "./EditImageModal";

function Images() {
  // should eventually use status to show something while fetching whether user
  // is logged in or not
  const { data: session, status } = useSession();

  const { data: images, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery();
  const { data: folders, isLoading: isLoadingFolders } =
    trpc.images.getUserFolders.useQuery();

  const [imageBeingEdited, setImageBeingEdited] = useState<Image>();

  if (isLoadingImages || isLoadingFolders) return <div>Fetching images...</div>;

  // should probably also use this for showing the folders area, obv don't forget back arrow navigation
  // to here

  return (
    <div>
      {folders && <div>folders coming soon!</div>}
      {images && (
        <div className="grid grid-cols-5 grid-rows-4 gap-4">
          {images.map((image) => {
            return (
              <UploadedImage
                image={image}
                key={image.id}
                setImageBeingEdited={setImageBeingEdited}
              />
            );
          })}
        </div>
      )}

      {imageBeingEdited && (
        <EditImageModal
          image={imageBeingEdited}
          setImageBeingEdited={setImageBeingEdited}
        />
      )}
    </div>
  );
}

export default Images;

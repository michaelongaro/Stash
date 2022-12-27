import React, { useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import SelectedImages from "./SelectedImages";
import UploadedImage from "./UploadedImage";
import Folders from "./Folders";
import EditImageModal from "./EditImageModal";
import { type Image, type Folder } from "@prisma/client";
import StashLogoAnimation from "../logo/StashLogoAnimation";

function Images() {
  const localStorageID = useLocalStorageContext();

  const { data: session } = useSession();

  const { data: userImages, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(
      localStorageID?.value ?? session?.user?.id
    );
  const { data: folders, isLoading: isLoadingFolders } =
    trpc.folders.getUserFolders.useQuery(
      localStorageID?.value ?? session?.user?.id
    );

  const [showLoadingAnimation, setShowLoadingAnimation] =
    useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: imagesFromSelectedFolder } =
    trpc.images.retrieveImageFromFolder.useQuery(selectedFolder?.id ?? "");

  const [imageBeingEdited, setImageBeingEdited] = useState<Image>();
  const [imagesToShow, setImagesToShow] = useState<Image[]>([]);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  useEffect(() => {
    if (imagesFromSelectedFolder !== undefined && selectedFolder) {
      setImagesToShow(imagesFromSelectedFolder);
    } else if (userImages && userImages.length > 0) {
      setImagesToShow(userImages);
    }
  }, [userImages, selectedFolder, imagesFromSelectedFolder]);

  useEffect(() => {
    let timeoutID: ReturnType<typeof setTimeout>;
    if (folders && userImages) {
      timeoutID = setTimeout(() => setShowLoadingAnimation(false), 2850);
    }

    return () => {
      clearTimeout(timeoutID);
    };
  }, [folders, userImages]);

  if (isLoadingImages || isLoadingFolders) return <></>;

  return (
    <div className="mt-2 w-[85vw] pb-[15%]">
      {showLoadingAnimation ? (
        <div className="flex min-h-[75vh] flex-col items-center justify-center gap-2">
          <div className="flex flex-col items-center justify-center gap-8 rounded-md bg-blue-200/90 p-12">
            <StashLogoAnimation size={"8rem"} />
            <div className="text-xl text-blue-400">Loading...</div>
          </div>
        </div>
      ) : (
        <>
          {!showLoadingAnimation && folders && (
            <Folders
              folders={folders}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
              setSelectedImages={setSelectedImages}
              setImageBeingEdited={setImageBeingEdited}
            />
          )}

          <AnimatePresence
            initial={false}
            mode={"wait"}
            onExitComplete={() => null}
          >
            {selectedImages && selectedImages.length > 0 && (
              <SelectedImages
                selectedImageIDs={selectedImages}
                setSelectedImageIDs={setSelectedImages}
              />
            )}
          </AnimatePresence>

          {imagesToShow && (
            <div className="m-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {imagesToShow.map((image) => {
                return (
                  <UploadedImage
                    key={image.id}
                    image={image}
                    imageBeingEdited={imageBeingEdited}
                    setImageBeingEdited={setImageBeingEdited}
                    selectedImages={selectedImages}
                    setSelectedImages={setSelectedImages}
                  />
                );
              })}
            </div>
          )}

          <AnimatePresence
            initial={false}
            mode={"wait"}
            onExitComplete={() => null}
          >
            {imageBeingEdited && (
              <EditImageModal
                image={imageBeingEdited}
                setImageBeingEdited={setImageBeingEdited}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default Images;

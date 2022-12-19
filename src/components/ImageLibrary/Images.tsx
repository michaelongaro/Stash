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
  // should eventually use status to show something while fetching whether user
  // is logged in or not
  const localStorageID = useLocalStorageContext();

  const { data: session, status } = useSession();

  const { data: userImages, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(
      localStorageID?.value ?? session?.user?.id
    );
  const { data: folders, isLoading: isLoadingFolders } =
    trpc.folders.getUserFolders.useQuery(
      localStorageID?.value ?? session?.user?.id
    );

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const {
    data: imagesFromSelectedFolder,
    isLoading: isLoadingSelectedFolderImages,
  } = trpc.images.retrieveImageFromFolder.useQuery(selectedFolder?.id ?? "");

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

  if (isLoadingImages || isLoadingFolders) return <></>;

  return (
    <div className="mt-2 w-[85vw] pb-[15%]">
      {!folders && !userImages ? (
        <div className="flex min-h-[100vh] flex-col items-center justify-center gap-2">
          <StashLogoAnimation size={"6rem"} />
          <div className="text-blue-500">Loading...</div>
        </div>
      ) : (
        <>
          {folders && userImages && (
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

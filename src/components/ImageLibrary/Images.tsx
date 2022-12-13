import React, { useEffect, useState } from "react";
import { trpc } from "../../utils/trpc";
import { useSession } from "next-auth/react";
import UploadedImage from "./UploadedImage";
import { type Image, type Folder } from "@prisma/client";
import EditImageModal from "./EditImageModal";
import {
  FaFolder,
  FaHome,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
} from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import SelectedImages from "./SelectedImages";
import { useLocalStorageContext } from "../../context/LocalStorageContext";

function Images() {
  // should eventually use status to show something while fetching whether user
  // is logged in or not
  const localStorageID = useLocalStorageContext();

  const { data: session, status } = useSession();
  const utils = trpc.useContext();

  const { data: userImages, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(
      localStorageID?.value ?? session?.user?.id
    );
  const { data: folders, isLoading: isLoadingFolders } =
    trpc.images.getUserFolders.useQuery(
      localStorageID?.value ?? session?.user?.id
    );

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const {
    data: imagesFromSelectedFolder,
    isLoading: isLoadingSelectedFolderImages,
  } = trpc.images.retrieveImageFromFolder.useQuery(selectedFolder?.id ?? "");

  const [imageBeingEdited, setImageBeingEdited] = useState<Image>();
  const [imagesToShow, setImagesToShow] = useState<Image[]>([]);

  const [editingFolderData, setEditingFolderData] = useState<boolean>(false);
  const [temporaryFolderData, setTemporaryFolderData] = useState<Folder | null>(
    null
  );

  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const updateFolderData = trpc.images.updateFolderData.useMutation({
    onMutate: () => {
      utils.images.getUserFolders.cancel();
      const optimisticUpdate = utils.images.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.images.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      setSelectedFolder(temporaryFolderData);
      setEditingFolderData(false);
    },
    onSettled: () => {
      utils.images.getUserFolders.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  const deleteFolder = trpc.images.deleteFolder.useMutation({
    onMutate: () => {
      utils.images.getUserFolders.cancel();
      const optimisticUpdate = utils.images.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.images.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      utils.images.getUserFolders.invalidate();
      setSelectedFolder(null);
    },
    onSettled: () => {
      utils.images.getUserFolders.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  useEffect(() => {
    if (imagesFromSelectedFolder !== undefined && selectedFolder) {
      setImagesToShow(imagesFromSelectedFolder);
    } else if (userImages && userImages.length > 0) {
      setImagesToShow(userImages);
    }
  }, [userImages, selectedFolder, imagesFromSelectedFolder]);

  useEffect(() => {
    setTemporaryFolderData(selectedFolder); // maybe a problem?
  }, [selectedFolder]);

  if (isLoadingImages || isLoadingFolders) return <></>;

  return (
    <div className="mt-2 w-[85vw] pb-[15%]">
      {folders && userImages && (
        <div className="rounded-md bg-blue-500 p-2">
          {selectedFolder ? (
            <div className="flex flex-col items-center justify-start gap-4 sm:flex-row">
              <button
                className="secondaryBtn flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedFolder(null);
                }}
              >
                <FaHome size={"1rem"} />
                Back to home
              </button>

              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-2">
                  {editingFolderData ? (
                    <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <div className="flex items-center justify-center gap-2">
                        <FaFolder size={"1rem"} />
                        <input
                          className="w-full rounded-md pl-2"
                          type="text"
                          placeholder="Title"
                          value={temporaryFolderData?.title ?? "Loading..."}
                          onChange={(e) => {
                            const newFolderData = { ...selectedFolder };
                            newFolderData.title = e.target.value;
                            setTemporaryFolderData(newFolderData);
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="secondaryBtn"
                          onClick={() => {
                            const newFolderData = { ...selectedFolder };
                            newFolderData.title = selectedFolder.title;
                            setTemporaryFolderData(newFolderData);
                            setEditingFolderData(false);
                          }}
                        >
                          <FaTimes size={"1rem"} />
                        </button>
                        <button
                          className="secondaryBtn"
                          onClick={() => {
                            // call update folder mutation here
                            if (temporaryFolderData) {
                              updateFolderData.mutate({
                                id: temporaryFolderData.id,
                                title: temporaryFolderData.title,
                                description: temporaryFolderData?.description,
                              });
                            }
                          }}
                        >
                          <FaCheck size={"1rem"} />
                        </button>
                      </div>

                      <button
                        className="dangerBtn"
                        onClick={() =>
                          deleteFolder.mutate({
                            id: selectedFolder.id,
                          })
                        }
                      >
                        <FaTrash size={"1rem"} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <FaFolder size={"1rem"} />

                      <div>{selectedFolder.title}</div>
                      <button
                        className="secondaryBtn"
                        onClick={() => setEditingFolderData(true)}
                      >
                        <FaEdit size={"1rem"} />
                      </button>

                      <button
                        className="dangerBtn"
                        onClick={() =>
                          deleteFolder.mutate({
                            id: selectedFolder.id,
                          })
                        }
                      >
                        <FaTrash size={"1rem"} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="pl-2 text-xl">Folders</div>
              <div className="flex flex-wrap items-center justify-start gap-4 ">
                {folders.map((folder) => {
                  return (
                    <button
                      key={folder.id}
                      className="secondaryBtn flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedFolder(folder);
                      }}
                      onMouseEnter={() => {
                        // setHovering             probably end up extracting this to sep. component so you can have just one state like this
                      }}
                    >
                      <FaFolder size={"1rem"} />
                      {folder.title}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
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
        <div className="m-6 grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {imagesToShow.map((image, index) => {
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
    </div>
  );
}

export default Images;

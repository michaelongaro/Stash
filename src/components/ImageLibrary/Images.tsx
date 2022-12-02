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

function Images() {
  // should eventually use status to show something while fetching whether user
  // is logged in or not
  const { data: session, status } = useSession();
  const utils = trpc.useContext();

  const { data: userImages, isLoading: isLoadingImages } =
    trpc.images.getUserImages.useQuery(localStorage.getItem("userID"));
  const { data: folders, isLoading: isLoadingFolders } =
    trpc.images.getUserFolders.useQuery(localStorage.getItem("userID"));

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

  const deleteFolder = trpc.images.deleteImage.useMutation({
    onMutate: () => {
      utils.images.getUserFolders.cancel();
      const optimisticUpdate = utils.images.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.images.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSuccess() {
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
    <div className="mt-2 min-w-[85vw]">
      {folders && userImages && (
        <div className="rounded-md bg-blue-500 p-2">
          {selectedFolder ? (
            <div className="flex items-center justify-start gap-4">
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
                  <FaFolder size={"1rem"} />
                  {editingFolderData ? (
                    <div className="flex items-center justify-center gap-2">
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
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <div>{selectedFolder.title}</div>
                      <button
                        className="secondaryBtn"
                        onClick={() => setEditingFolderData(true)}
                      >
                        <FaEdit size={"1rem"} />
                      </button>
                    </div>
                  )}
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
            </div>
          ) : (
            <div>
              <div className="pl-2 text-xl">Folders </div>
              <div className="flex max-w-[85vw] flex-wrap items-center justify-start gap-4 ">
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
            </div>
          )}
        </div>
      )}

      {imagesToShow && (
        <div className="m-6 grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {imagesToShow.map((image) => {
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

import React from "react";
import { motion } from "framer-motion";
import { type Image, type Folder } from "@prisma/client";
import { dropIn } from "../../utils/framerMotionDropInStyles";
import { trpc } from "../../utils/trpc";

interface IConfirmDeleteModal {
  type: "image" | "images" | "folder";
  setShowConfirmDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  idsToDelete: string[];
  afterImageDeletionCallback?: React.Dispatch<
    React.SetStateAction<Image | undefined>
  >;
  afterBulkImageDeletionCallback?: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  afterFolderDeletionCallback?: React.Dispatch<
    React.SetStateAction<Folder | null>
  >;
}

function ConfirmDeleteModal({
  type,
  setShowConfirmDeleteModal,
  idsToDelete,
  afterImageDeletionCallback,
  afterBulkImageDeletionCallback,
  afterFolderDeletionCallback,
}: IConfirmDeleteModal) {
  const utils = trpc.useContext();

  const deleteImage = trpc.images.deleteImage.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
      utils.images.retrieveImageFromFolder.invalidate();
      if (afterImageDeletionCallback) {
        afterImageDeletionCallback(undefined);
      }
      setShowConfirmDeleteModal(false);
    },
  });

  const deleteSelectedImages = trpc.images.deleteSelectedImages.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
      if (afterBulkImageDeletionCallback) {
        afterBulkImageDeletionCallback([]);
      }
      setShowConfirmDeleteModal(false);
    },
  });

  const deleteFolder = trpc.folders.deleteFolder.useMutation({
    onMutate: () => {
      utils.folders.getUserFolders.cancel();
      const optimisticUpdate = utils.folders.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.folders.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.folders.getUserFolders.invalidate();
      if (afterFolderDeletionCallback) {
        afterFolderDeletionCallback(null);
      }
      setShowConfirmDeleteModal(false);
    },
  });

  let dataType;

  if (type === "image") {
    dataType = "this image";
  } else if (type === "images") {
    dataType = "these images";
  } else if (type === "folder") {
    dataType = "this folder";
  }

  return (
    <motion.div
      key={"confirmDeleteOuter"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 z-[500] flex h-full w-full items-center justify-center bg-blue-700/70 transition-all"
    >
      <motion.div
        key={"confirmDeleteInner"}
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex flex-col items-center justify-center gap-4 rounded-md bg-blue-400 p-8"
      >
        <div className="text-center">
          {`Are you sure you want to delete ${dataType}?`}
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="secondaryBtn"
            onClick={() => {
              setShowConfirmDeleteModal(false);
            }}
          >
            Keep
          </button>
          <button
            className="dangerBtn"
            onClick={() => {
              if (type === "image" && idsToDelete[0]) {
                deleteImage.mutate({
                  id: idsToDelete[0],
                });
              } else if (type === "images") {
                deleteSelectedImages.mutate({
                  idsToUpdate: idsToDelete,
                });
              } else if (type === "folder" && idsToDelete[0]) {
                deleteFolder.mutate({
                  id: idsToDelete[0],
                });
              }
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ConfirmDeleteModal;

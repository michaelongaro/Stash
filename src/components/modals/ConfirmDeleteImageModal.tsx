import React from "react";
import { motion } from "framer-motion";
import { type Image } from "@prisma/client";
import { dropIn } from "../../utils/framerMotionDropInStyles";
import { trpc } from "../../utils/trpc";

interface IConfirmDeleteImageModal {
  setShowConfirmDeleteImageModal: React.Dispatch<React.SetStateAction<boolean>>;
  images: Image[];
  setImageBeingEdited: React.Dispatch<React.SetStateAction<Image | undefined>>;
  // maybe change this one above
  deleteOne: boolean;
}

// I think I like the idea of the modal being separate and handling the mutation of the
// data that it gets passed into it.

function ConfirmDeleteImageModal({
  setShowConfirmDeleteImageModal,
  images,
  setImageBeingEdited,
  deleteOne,
}: IConfirmDeleteImageModal) {
  const utils = trpc.useContext();

  const deleteImage = trpc.images.deleteImage.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      setImageBeingEdited(undefined);
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  return (
    <motion.div
      key={images[0]?.id ?? "confirmDeleteOuter"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute top-0 left-0 z-[500] flex h-full w-full items-center justify-center bg-blue-700/70 transition-all"
    >
      <motion.div
        key={images[0]?.title ?? "confirmDeleteInner"}
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative flex flex-col items-center justify-center gap-4 rounded-md bg-blue-400 p-8"
      >
        <div className="text-center">
          Are you sure you want to delete this image?
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            className="secondaryBtn"
            onClick={() => {
              setShowConfirmDeleteImageModal(false);
            }}
          >
            Keep
          </button>
          <button
            className="dangerBtn"
            onClick={() => {
              if (deleteOne && images[0]) {
                deleteImage.mutate({
                  id: images[0].id,
                });
              } else if (!deleteOne) {
                // deleteAllSeletedImages.mutate({
                //
                // });
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

export default ConfirmDeleteImageModal;

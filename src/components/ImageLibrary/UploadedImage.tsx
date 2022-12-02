import React, { useState, useRef } from "react";
import { type Image as PrismaImage } from "@prisma/client";

import { FaEllipsisH, FaLink, FaLock, FaLockOpen } from "react-icons/fa";

import Image from "next/image";
import { trpc } from "../../utils/trpc";

interface IUploadedImage {
  image: PrismaImage;
  setImageBeingEdited: React.Dispatch<
    React.SetStateAction<PrismaImage | undefined>
  >;
}

function UploadedImage({ image, setImageBeingEdited }: IUploadedImage) {
  const utils = trpc.useContext();

  const [hoveringOnImage, setHoveringOnImage] = useState<boolean>(false);
  const [hoveringOnLockButton, setHoveringOnLockButton] =
    useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);

  const topControlsContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomControlsContainerRef = useRef<HTMLDivElement | null>(null);

  const updateImageData = trpc.images.updateImageData.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
    },
  });

  // not sure if mentioned but maybe have a lock in top left to toggle public/private?
  return (
    <div
      // style={{ backgroundColor: hoveringOnImage ? "" : "" }}
      className="relative flex items-center justify-center rounded-md transition-all hover:bg-blue-200"
      onMouseEnter={() => setHoveringOnImage(true)}
      onMouseLeave={() => setHoveringOnImage(false)}
    >
      <div
        ref={topControlsContainerRef}
        style={{
          top: hoveringOnImage
            ? "-10px"
            : topControlsContainerRef.current
            ? `${
                -1 *
                topControlsContainerRef.current?.getBoundingClientRect().height
              }px`
            : 0,
          opacity: hoveringOnImage ? 1 : 0,
          pointerEvents: hoveringOnImage ? "auto" : "none",
        }}
        className={`absolute left-0 flex w-full items-center justify-between gap-4 rounded-tl-md rounded-tr-md bg-blue-400 pl-4 pr-4 pt-1 pb-1 transition-all`}
        // onMouseEnter={() => setHoveringOnImage(true)}
        // onMouseLeave={() => setHoveringOnImage(false)}
      >
        <div>{image.title}</div>
        <div className="align-center flex justify-center gap-2">
          <button
            className="secondaryBtn"
            onMouseEnter={() => setHoveringOnLockButton(true)}
            onMouseLeave={() => setHoveringOnLockButton(false)}
            onClick={() =>
              updateImageData.mutate({
                ...image,
                isPublic: !image.isPublic,
              })
            }
          >
            {image.isPublic ? (
              <>
                {hoveringOnLockButton ? (
                  <FaLock size={"1rem"} />
                ) : (
                  <FaLockOpen size={"1rem"} />
                )}
              </>
            ) : (
              <>
                {hoveringOnLockButton ? (
                  <FaLockOpen size={"1rem"} />
                ) : (
                  <FaLock size={"1rem"} />
                )}
              </>
            )}
          </button>

          {/* eventually have react-toast notification once clicked */}
          <button
            className="secondaryBtn"
            onClick={() => setShowOptionsMenu(true)}
          >
            <FaEllipsisH size={"1rem"} />
          </button>
        </div>
      </div>

      {/* how to have dynamic width/height... */}
      <Image
        className="cursor-pointer rounded-md" // h-auto w-full
        src={image.s3ImageURL}
        alt={image?.title ?? "uploaded image"}
        style={{ boxShadow: "2px 3px 5px 0px #0000006b" }}
        width={250} // this will have to be caluclated based on screen width/individual grid cell size...
        height={250} // this will have to be caluclated based on screen width/individual grid cell size...
        onClick={() => setImageBeingEdited(image)}
      />

      <div
        ref={bottomControlsContainerRef}
        style={{
          bottom: hoveringOnImage
            ? "-10px"
            : bottomControlsContainerRef.current
            ? `${
                -1 *
                bottomControlsContainerRef.current?.getBoundingClientRect()
                  .height
              }px`
            : 0,
          opacity: hoveringOnImage ? 1 : 0,
          pointerEvents: hoveringOnImage ? "auto" : "none",
        }}
        className={`absolute left-0 flex w-full items-center justify-center gap-8 rounded-bl-md rounded-br-md bg-blue-500 pl-4 pr-4 pt-1 pb-1 transition-all`}
        // onMouseEnter={() => setHoveringOnImage(true)}
        // onMouseLeave={() => setHoveringOnImage(false)}
      >
        <button
          className="secondaryBtn"
          onClick={() => setImageBeingEdited(image)}
        >
          Edit
        </button>

        {/* eventually have react-toast notification once clicked */}
        <button
          className="secondaryBtn"
          onClick={() =>
            navigator.clipboard.writeText(
              `http://localhost:3000/${image.randomizedURL}`
            )
          }
        >
          <FaLink size={"1rem"} />
        </button>
      </div>
    </div>
  );
}

export default UploadedImage;

import React, { useState, useEffect, useRef } from "react";
import { type Image as PrismaImage } from "@prisma/client";
import { FaLink, FaLock, FaLockOpen } from "react-icons/fa";

import Image from "next/image";
import { trpc } from "../../utils/trpc";
import { isMobile } from "react-device-detect";
import { motion } from "framer-motion";
import { dropIn } from "../../utils/framerMotionDropInStyles";
import base64Logo from "../../utils/base64Logo";
import { toastNotification } from "../../utils/toastNotification";
import LoadingDots from "../loadingAssets/LoadingDots";
import useReturnFocusAfterModalClose from "../../hooks/useReturnFocusAfterModalClose";
import { useLocalStorageContext } from "../../context/LocalStorageContext";
import { useSession } from "next-auth/react";

interface IUploadedImage {
  image: PrismaImage;
  imageBeingEdited: PrismaImage | undefined;
  setImageBeingEdited: React.Dispatch<
    React.SetStateAction<PrismaImage | undefined>
  >;
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
}

function UploadedImage({
  image,
  imageBeingEdited,
  setImageBeingEdited,
  selectedImages,
  setSelectedImages,
}: IUploadedImage) {
  const { data: session } = useSession();
  const utils = trpc.useContext();
  const localStorageID = useLocalStorageContext();

  let { data: hidePrivateImages } =
    trpc.users.getHidePrivateImageStatus.useQuery(
      localStorageID?.value ?? session?.user?.id
    );

  const [hoveringOnImage, setHoveringOnImage] = useState<boolean>(false);
  const [hoveringOnLockButton, setHoveringOnLockButton] =
    useState<boolean>(false);
  const [imageIsSelected, setImageIsSelected] = useState<boolean>(false);
  const [imageIsFocused, setImageIsFocused] = useState<boolean>(false);

  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const topControlsContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomControlsContainerRef = useRef<HTMLDivElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isBeingUpdated, setIsBeingUpdated] = useState<boolean>(false);

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
      utils.images.retrieveImageFromFolder.invalidate();
      setIsBeingUpdated(false);
      toastNotification(
        `Image set to ${!image.isPublic ? "public" : "private"}`
      );
    },
  });

  useEffect(() => {
    if (selectedImages.includes(image.id)) {
      setImageIsSelected(true);
    } else {
      setImageIsSelected(false);
    }
  }, [selectedImages, image]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key !== "Tab" && e.key !== "Shift") return;

      if (
        parentContainerRef.current &&
        parentContainerRef.current.contains(document.activeElement)
      ) {
        setImageIsFocused(true);
      } else {
        setImageIsFocused(false);
      }
    }

    document.addEventListener("keyup", handleKeydown);
    return () => {
      document.removeEventListener("keyup", handleKeydown);
    };
  }, []);

  useReturnFocusAfterModalClose({
    initiatorElement: editButtonRef,
    modalOpenedValue: imageBeingEdited === image,
  });

  // makes sure that private images are hidden until the query is resolved
  if (hidePrivateImages === undefined) {
    hidePrivateImages = true;
  }

  return (
    <motion.div
      ref={parentContainerRef}
      key={image.id}
      variants={dropIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        background:
          hoveringOnImage || imageIsSelected || imageIsFocused
            ? " rgb(191 219 254)"
            : "",
      }}
      className="relative flex min-h-[250px] items-center justify-center rounded-md transition-all"
      onMouseEnter={() => setHoveringOnImage(true)}
      onMouseLeave={() => setHoveringOnImage(false)}
      onTouchStart={() => setHoveringOnImage(true)}
      onBlur={() => setHoveringOnImage(false)}
    >
      <div
        ref={topControlsContainerRef}
        style={{
          top:
            hoveringOnImage || imageIsSelected || imageIsFocused
              ? "-10px"
              : topControlsContainerRef.current
              ? `${
                  -0.4 *
                  topControlsContainerRef.current?.getBoundingClientRect()
                    .height
                }px`
              : 0,
          opacity: hoveringOnImage || imageIsSelected || imageIsFocused ? 1 : 0,
          pointerEvents:
            hoveringOnImage || imageIsSelected || imageIsFocused
              ? "auto"
              : "none",
        }}
        className={`absolute left-0 flex w-full items-center justify-between gap-4 rounded-tl-md rounded-tr-md bg-blue-400 pl-4 pr-4 pt-1 pb-1 transition-all`}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "block",
          }}
        >
          {image.title}
        </div>
        <div className="align-center flex justify-center gap-2">
          <button
            className="secondaryBtn"
            aria-label="Toggle visibility of image between public and private"
            onMouseEnter={() => setHoveringOnLockButton(true)}
            onMouseLeave={() => setHoveringOnLockButton(false)}
            onClick={() => {
              updateImageData.mutate({
                ...image,
                isPublic: !image.isPublic,
              });
              setIsBeingUpdated(true);
            }}
          >
            {isBeingUpdated ? (
              <LoadingDots width={32} height={16} radius={12} />
            ) : (
              <>
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
              </>
            )}
          </button>

          <div className="flex items-center justify-center">
            <input
              className="h-[1.25rem] w-[1.25rem] cursor-pointer"
              aria-label="select image toggle"
              type="checkbox"
              checked={selectedImages.includes(image.id)}
              onChange={() =>
                setSelectedImages((prevSelectedImages) => {
                  if (prevSelectedImages.includes(image.id)) {
                    return prevSelectedImages.filter(
                      (selectedImage) => selectedImage !== image.id
                    );
                  } else {
                    return [...prevSelectedImages, image.id];
                  }
                })
              }
            />
          </div>
        </div>
      </div>

      <div
        style={{
          opacity:
            hidePrivateImages && !image.isPublic && !hoveringOnImage ? 1 : 0,
          pointerEvents:
            hidePrivateImages && !image.isPublic && !hoveringOnImage
              ? "auto"
              : "none",
          width:
            hidePrivateImages && !image.isPublic && !hoveringOnImage
              ? "100%"
              : 0,
        }}
        className="relative z-[-1] rounded-md  transition-all"
      >
        <div className="absolute top-0 left-0 z-50 flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-2 drop-shadow-md">
            <FaLock size={"2rem"} />
            <div>Private</div>
          </div>
        </div>
        <div className="rounded-md bg-blue-700">
          <Image
            className="h-full w-full cursor-pointer rounded-md opacity-40 shadow-lg"
            src={image.blurredImageData ?? base64Logo}
            alt={image?.title ?? "uploaded image"}
            width={250}
            height={250}
            priority={true}
            onClick={() => {
              if (!isMobile) {
                setImageBeingEdited(image);
              }
            }} // needed?
          />
        </div>
      </div>
      <div
        style={{
          opacity:
            image.isPublic ||
            (!image.isPublic && !hidePrivateImages) ||
            hoveringOnImage
              ? 1
              : 0,
          pointerEvents:
            image.isPublic ||
            (!image.isPublic && !hidePrivateImages) ||
            hoveringOnImage
              ? "auto"
              : "none",
          width:
            image.isPublic ||
            (!image.isPublic && !hidePrivateImages) ||
            hoveringOnImage
              ? "100%"
              : 0,
          height:
            image.isPublic ||
            (!image.isPublic && !hidePrivateImages) ||
            hoveringOnImage
              ? "100%"
              : 0,
          transition: "all 150ms",
        }}
        className="z-[-1] flex items-center justify-center"
      >
        <Image
          className="h-auto w-auto cursor-pointer rounded-md shadow-lg"
          src={image.s3ImageURL}
          alt={image?.title ?? "uploaded image"}
          width={250}
          height={250}
          priority={true}
          onClick={() => {
            if (!isMobile) {
              setImageBeingEdited(image);
            }
          }}
          placeholder={"blur"}
          blurDataURL={image.blurredImageData ?? base64Logo}
        />
      </div>

      <div
        ref={bottomControlsContainerRef}
        style={{
          bottom:
            hoveringOnImage || imageIsSelected || imageIsFocused
              ? "-10px"
              : bottomControlsContainerRef.current
              ? `${
                  -0.4 *
                  bottomControlsContainerRef.current?.getBoundingClientRect()
                    .height
                }px`
              : 0,
          opacity: hoveringOnImage || imageIsSelected || imageIsFocused ? 1 : 0,
          pointerEvents:
            hoveringOnImage || imageIsSelected || imageIsFocused
              ? "auto"
              : "none",
        }}
        className={`absolute left-0 flex w-full items-center justify-center gap-8 rounded-bl-md rounded-br-md bg-blue-500 pl-4 pr-4 pt-1 pb-1 text-blue-400 transition-all`}
      >
        <button
          ref={editButtonRef}
          className="secondaryBtn"
          aria-label="Edit image details"
          onClick={() => setImageBeingEdited(image)}
        >
          Edit
        </button>

        <button
          className="secondaryBtn"
          aria-label="copy sharable link to clipboard"
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location}${image.randomizedURL}`
            );
            toastNotification("Sharable link copied");
          }}
        >
          <FaLink size={"1rem"} />
        </button>
      </div>
    </motion.div>
  );
}

export default UploadedImage;

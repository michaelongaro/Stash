import React, { useState, useEffect, useRef } from "react";
import { type Image as PrismaImage } from "@prisma/client";
import { FaLink, FaLock, FaLockOpen } from "react-icons/fa";

import Image from "next/image";
import { trpc } from "../../utils/trpc";
import { toast } from "react-toastify";
import { isMobile } from "react-device-detect";
import { motion } from "framer-motion";
import { dropIn } from "../../utils/framerMotionDropInStyles";

interface IUploadedImage {
  image: PrismaImage;
  setImageBeingEdited: React.Dispatch<
    React.SetStateAction<PrismaImage | undefined>
  >;
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
}

function UploadedImage({
  image,
  setImageBeingEdited,
  selectedImages,
  setSelectedImages,
}: IUploadedImage) {
  const utils = trpc.useContext();

  const [hoveringOnImage, setHoveringOnImage] = useState<boolean>(false);
  const [hoveringOnLockButton, setHoveringOnLockButton] =
    useState<boolean>(false);
  const [imageIsSelected, setImageIsSelected] = useState<boolean>(false);

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

  useEffect(() => {
    if (selectedImages.includes(image.id)) {
      setImageIsSelected(true);
    } else {
      setImageIsSelected(false);
    }
  }, [selectedImages, image]);

  return (
    <motion.div
      key={image.id}
      variants={dropIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative flex min-h-[250px] items-center justify-center rounded-md transition-all hover:bg-blue-200"
      onMouseEnter={() => setHoveringOnImage(true)}
      onMouseLeave={() => setHoveringOnImage(false)}
      onTouchStart={() => setHoveringOnImage(true)}
      onBlur={() => setHoveringOnImage(false)}
    >
      <div
        ref={topControlsContainerRef}
        style={{
          top:
            hoveringOnImage || imageIsSelected
              ? "-10px"
              : topControlsContainerRef.current
              ? `${
                  -0.4 *
                  topControlsContainerRef.current?.getBoundingClientRect()
                    .height
                }px`
              : 0,
          opacity: hoveringOnImage || imageIsSelected ? 1 : 0,
          pointerEvents: hoveringOnImage || imageIsSelected ? "auto" : "none",
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

          <div className="flex items-center justify-center">
            <input
              className="h-[1.25rem] w-[1.25rem]"
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

      {/* how to have dynamic width/height... */}
      <Image
        className="cursor-pointer rounded-md shadow-lg" // h-auto w-full
        src={image.s3ImageURL}
        alt={image?.title ?? "uploaded image"}
        width={250} // this will have to be caluclated based on screen width/individual grid cell size...
        height={250} // this will have to be caluclated based on screen width/individual grid cell size...
        onClick={() => {
          if (!isMobile) {
            setImageBeingEdited(image);
          }
        }}
        placeholder={"blur"}
        blurDataURL={
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjQxMyIgdmlld0JveD0iMCAwIDM5MCA0MTMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSIjMUUxRTFFIi8+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSJ3aGl0ZSIvPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPgo8cGF0aCBkPSJNMTMwLjUgMjY1TDE2Mi41IDE5OS4yNUwxOTQuNSAxMzMuNUwyNTkuNSAyNjUiIHN0cm9rZT0iIzFENEVEOCIgc3Ryb2tlLXdpZHRoPSIyNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjExMy45OTciIHk9IjEyMSIgd2lkdGg9IjE2Mi4wMDYiIGhlaWdodD0iMTY0LjUwMyIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSI0Ii8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjIiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMF8xIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzBfMSIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPC9kZWZzPgo8L3N2Zz4K"
        }
      />

      <div
        ref={bottomControlsContainerRef}
        style={{
          bottom:
            hoveringOnImage || imageIsSelected
              ? "-10px"
              : bottomControlsContainerRef.current
              ? `${
                  -0.4 *
                  bottomControlsContainerRef.current?.getBoundingClientRect()
                    .height
                }px`
              : 0,
          opacity: hoveringOnImage || imageIsSelected ? 1 : 0,
          pointerEvents: hoveringOnImage || imageIsSelected ? "auto" : "none",
        }}
        className={`absolute left-0 flex w-full items-center justify-center gap-8 rounded-bl-md rounded-br-md bg-blue-500 pl-4 pr-4 pt-1 pb-1 text-blue-400 transition-all`}
      >
        <button
          className="secondaryBtn"
          onClick={() => setImageBeingEdited(image)}
        >
          Edit
        </button>

        <button
          className="secondaryBtn"
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location}${image.randomizedURL}`
            );

            toast.success("Sharable link copied!", {
              position: "bottom-center",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
            });
          }}
        >
          <FaLink size={"1rem"} />
        </button>
      </div>
    </motion.div>
  );
}

export default UploadedImage;

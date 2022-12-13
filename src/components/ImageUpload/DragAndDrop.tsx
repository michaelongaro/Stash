import isEqual from "lodash.isequal";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import formatBytes from "../../utils/formatBytes";

import { HiOutlineCursorClick } from "react-icons/hi";

import classes from "./DragAndDrop.module.css";
import ImageReviewModal from "./ImageReviewModal";
import { AnimatePresence } from "framer-motion";

export interface IImage {
  imageFile: File;
  name: string;
  lastModified: string;
  size: string;
}

interface IDragAndDrop {
  renderedLocation: string;
  files: IImage[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
  usedInReviewModal: boolean;
}

function DragAndDrop({
  renderedLocation,
  files,
  setFiles,
  usedInReviewModal,
}: IDragAndDrop) {
  const [borderColor, setBorderColor] = useState<string>("#eeeeee");
  const [imagesHaveBeenAdded, setImagesHaveBeenAdded] =
    useState<boolean>(false);
  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    acceptedFiles,
  } = useDropzone({
    accept: {
      "image/*": [],
    },
    maxSize: 157286400, // 150MB
    multiple: true,
  });

  useEffect(() => {
    if (isFocused) {
      setBorderColor("#2196f3");
    } else if (isDragAccept) {
      setBorderColor("#00e676");
    } else if (isDragReject) {
      setBorderColor("#ff1744");
    } else {
      setBorderColor("#bfbfbf");
    }
  }, [isFocused, isDragAccept, isDragReject]);

  useEffect(() => {
    if (acceptedFiles.length > 0) {
      setImagesHaveBeenAdded(true);
    }
  }, [acceptedFiles]);

  useEffect(() => {
    if (acceptedFiles.length > 0 && imagesHaveBeenAdded) {
      const newFiles: IImage[] = [...files];
      acceptedFiles.map((file) => {
        newFiles.push({
          imageFile: file,
          name: file.name,
          lastModified: new Date(file.lastModified).toLocaleString("en-US", {
            timeZone: "UTC",
          }),
          size: formatBytes(file.size),
        });
      });

      if (!isEqual(files, newFiles)) {
        setFiles(newFiles);
        setImagesHaveBeenAdded(false);
      }
    }
  }, [acceptedFiles, files, imagesHaveBeenAdded]);

  function getContainerClass(renderedLocation: string) {
    if (renderedLocation === "homepage") {
      return classes.homepageContainer;
    } else if (renderedLocation === "reviewModal") {
      return classes.reviewModalContainer;
    } else if (renderedLocation === "imagesLibrary") {
      return classes.imagesLibraryContainer;
    }
  }

  function getRootClass(renderedLocation: string) {
    if (renderedLocation === "homepage") {
      return classes.homepageDragAndDrop;
    } else if (renderedLocation === "reviewModal") {
      return classes.reviewModalDragAndDrop;
    } else if (renderedLocation === "imagesLibrary") {
      return classes.imagesLibraryDragAndDrop;
    }
  }

  return (
    <div
      className={`${getContainerClass(
        renderedLocation
      )} container flex items-center justify-center rounded-md bg-blue-300 p-1`}
    >
      <div
        style={{
          borderColor: borderColor,
          boxShadow: borderColor !== "#bfbfbf" ? "0 0 10px 4px #d7d7d7" : "",
          transition: "box-shadow 0.3s ease-in-out",
        }}
        {...getRootProps({
          className: `${classes.dropzone} ${getRootClass(
            renderedLocation
          )} rounded-md transition-all`,
        })}
      >
        <input {...getInputProps()} />
        <p
          className={`${classes.dragAndDropText} flex items-center justify-center gap-2`}
        >
          Drag + drop your image(s) here,
          <div className="flex items-center justify-center gap-2 text-[rgb(189,189,189)]">
            or
            <HiOutlineCursorClick size={"1.25rem"} />
            to manually select
          </div>
        </p>
        <p>- Size limit: 150MB -</p>
      </div>

      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {files.length > 0 && !usedInReviewModal && (
          // pass through setter (to be able to remove a file from being in upload queue)
          <ImageReviewModal files={files} setFiles={setFiles} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default DragAndDrop;

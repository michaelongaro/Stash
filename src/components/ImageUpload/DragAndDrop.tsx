import isEqual from "lodash.isequal";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import formatBytes from "../../utils/formatBytes";

import classes from "./DragAndDrop.module.css";
import ImageReviewModal from "./ImageReviewModal";

export interface IImage {
  imageFile: File;
  name: string;
  lastModified: string;
  size: string;
}

interface IDragAndDrop {
  containerWidth: string;
  containerHeight: string;
  containerBorderRadius: string;
  dragAndDropWidth: string;
  dragAndDropHeight: string;
  files: IImage[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
  usedInReviewModal: boolean;
}

function DragAndDrop({
  containerWidth,
  containerHeight,
  containerBorderRadius,
  dragAndDropWidth,
  dragAndDropHeight,
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
      setBorderColor("#eeeeee");
    }
  }, [isFocused, isDragAccept, isDragReject]);

  // This causes infinite loop... start here

  useEffect(() => {
    if (acceptedFiles.length > 0) {
      setImagesHaveBeenAdded(true);
    }
  }, [acceptedFiles]);

  useEffect(() => {
    console.log(acceptedFiles);

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

  // if designated as used in modal:
  // then just do above then setFiles(oldFiles => [...oldFiles, newFiles])

  return (
    // leave as a "section" tag?
    <section
      style={{
        minWidth: containerWidth,
        height: containerHeight,
        borderRadius: containerBorderRadius,
      }}
      className={`container flex items-center justify-center rounded-md bg-slate-300`}
    >
      <div
        style={{
          width: dragAndDropWidth,
          height: dragAndDropHeight,
          borderColor: borderColor,
        }}
        {...getRootProps({ className: classes.dropzone })}
      >
        <input {...getInputProps()} />
        {/* replace "click" with <HiOutlineCursorClick /> */}
        <p>Drag + drop your image(s) here, or click to manually select</p>
        <p>- Size limit: 150MB -</p>
      </div>

      {files.length > 0 && !usedInReviewModal && (
        // pass through setter (to be able to remove a file from being in upload queue)
        <ImageReviewModal files={files} setFiles={setFiles} />
      )}
    </section>
  );
}

export default DragAndDrop;

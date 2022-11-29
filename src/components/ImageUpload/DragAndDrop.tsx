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

function DragAndDrop() {
  const [files, setFiles] = useState<IImage[]>([]);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },
    multiple: true,

    // not sure if below is even necessary

    // onDrop: (acceptedFiles) => {
    //   setFiles(
    //     acceptedFiles.map((file) =>
    //       Object.assign(file, {
    //         preview: URL.createObjectURL(file), // probably need this
    //       })
    //     )
    //   );
    // },
  });

  // console.log(acceptedFiles, acceptedFiles.length);

  useEffect(() => {
    if (acceptedFiles.length > 0) {
      const newFiles: IImage[] = [];
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

      setFiles(newFiles);
    }
  }, [acceptedFiles]);

  return (
    // leave as a "section" tag?
    <section className="container flex h-20 min-w-full items-center justify-center bg-slate-300">
      <div {...getRootProps({ className: classes.dropzone })}>
        <input {...getInputProps()} />
        <p>Drag + drop your image file(s) here, or click to select files</p>
      </div>

      {/* move basically everything to context at a later point */}
      {files.length > 0 && (
        <ImageReviewModal files={files} setFiles={setFiles} />
      )}
    </section>
  );
}

export default DragAndDrop;

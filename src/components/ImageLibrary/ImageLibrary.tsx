import React, { useState } from "react";
import DragAndDrop, { type IImage } from "../ImageUpload/DragAndDrop";
import Navbar from "../navbar/Navbar";
import Images from "./Images";

function ImageLibrary() {
  const [files, setFiles] = useState<IImage[]>([]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Navbar />

      <DragAndDrop
        containerWidth={"85vw"}
        containerHeight={"85px"}
        containerBorderRadius={"0.375rem"}
        dragAndDropWidth={"50%"}
        dragAndDropHeight={"90%"}
        dragAndDropBorderRadius={"0.375rem"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />

      <Images />
    </div>
  );
}

export default ImageLibrary;

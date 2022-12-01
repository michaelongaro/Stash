import React, { useState } from "react";
import DragAndDrop, { type IImage } from "../ImageUpload/DragAndDrop";
import Navbar from "../navbar/Navbar";
import Images from "./Images";

function ImageLibrary() {
  const [files, setFiles] = useState<IImage[]>([]);

  return (
    <div className="flex flex-col">
      <Navbar />

      <DragAndDrop
        containerWidth={"100vw"}
        containerHeight={"85px"}
        containerBorderRadius={"0"}
        dragAndDropWidth={"50%"}
        dragAndDropHeight={"90%"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />

      <Images />
    </div>
  );
}

export default ImageLibrary;

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
        renderedLocation={"imagesLibrary"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />

      <Images />
    </div>
  );
}

export default ImageLibrary;

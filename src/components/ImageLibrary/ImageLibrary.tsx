import React from "react";
import DragAndDrop from "../ImageUpload/DragAndDrop";
import Navbar from "../navbar/Navbar";
import Images from "./Images";

function ImageLibrary() {
  return (
    <div className="flex flex-col">
      <Navbar />

      <DragAndDrop />

      <Images />
    </div>
  );
}

export default ImageLibrary;

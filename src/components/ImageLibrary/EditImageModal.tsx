import React, { useEffect, useState } from "react";
import { type Image as IImage } from "@prisma/client";

import { FaTimes, FaEdit, FaCrop } from "react-icons/fa";

import classes from "./EditImageModal.module.css";
import dynamic from "next/dynamic";
import Select from "react-select";
import { visibilityOptions } from "../ImageUpload/ImageReviewModal";
import Image from "next/image";

const DynamicHeader = dynamic(() => import("../ImageUpload/ImageEditorModal"), {
  ssr: false,
});

interface IEditImageModal {
  image: IImage;
  setImageBeingEdited: React.Dispatch<React.SetStateAction<IImage | undefined>>;
}

function EditImageModal({ image, setImageBeingEdited }: IEditImageModal) {
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  const [editedImageData, setEditedImageData] = useState<IImage>(image);
  const [imageToBeEdited, setImageToBeEdited] = useState<IImage>();

  // useEffect(() => {
  //   if (image) {

  //   }
  // }, [image])

  return (
    <div
      style={{
        opacity: image ? 1 : 0,
        pointerEvents: image ? "auto" : "none",
      }}
      className="absolute top-0 left-0 flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-slate-800 transition-all"
    >
      <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-slate-400/75 p-10">
        <div className={classes.editImageDetailsGrid}>
          <div className={classes.titleLabel}>Title</div>
          <div className={classes.titleInput}>
            {editingTitle ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  className={`${classes.titleInput} rounded-md pl-2 text-slate-700`}
                  type="text"
                  placeholder="Optional"
                  value={editedImageData.title ?? "Loading..."}
                  onChange={(e) => {
                    const newImageData = { ...editedImageData };
                    newImageData.title = e.target.value;
                    setEditedImageData(newImageData);
                  }}
                />
                <FaTimes
                  size={"1rem"}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingTitle(false)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-start gap-4">
                {image.title}
                <FaEdit
                  size={"1rem"}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingTitle(true)}
                />
              </div>
            )}
          </div>
          <div className={classes.descriptionLabel}>Description</div>
          <div className={classes.descriptionInput}>
            {editingDescription ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  className={`${classes.descriptionInput} rounded-md pl-2 text-slate-700`}
                  type="text"
                  placeholder="Optional"
                  value={editedImageData.description ?? "Loading..."}
                  onChange={(e) => {
                    const newImageData = { ...editedImageData };
                    newImageData.description = e.target.value;
                    setEditedImageData(newImageData);
                  }}
                />
                <FaTimes
                  size={"1rem"}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingDescription(false)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-start gap-4">
                {image.description}
                <FaEdit
                  size={"1rem"}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingDescription(true)}
                />
              </div>
            )}
          </div>
          <div className={classes.folderLabel}>Folder</div>
          <div className={classes.FolderDropdownInput}>{/* hold off */}</div>
          <div className={classes.visibilityLabel}>Visibility</div>
          <div className={classes.visibilityDowndownInput}>
            <Select
              options={visibilityOptions}
              onChange={(e) => {
                const newImageData = { ...editedImageData };
                newImageData.isPublic = e!.value;
                setEditedImageData(newImageData);
              }}
              value={
                editedImageData.isPublic
                  ? { label: "Public", value: true }
                  : { label: "Private", value: false }
              }
            />
          </div>
          <button
            className={`${classes.editButton} flex items-center justify-center gap-4`}
            onClick={() => setImageToBeEdited(editedImageData)}
          >
            Edit
            <FaCrop size={"1rem"} />
          </button>
          <button className={classes.saveButton}>Save</button>
          <div className={classes.closeButton}>
            <FaTimes size={"2rem"} style={{ cursor: "pointer" }} />
          </div>
        </div>

        <Image
          src={image.s3ImageURL}
          alt={image.title ?? "uploaded image"}
          width={500}
          height={500}
        />
      </div>

      {/* <DynamicHeader
        imageFile={imageToBeEdited?.s3ImageURL}
        setImageToBeEdited={setImageToBeEdited}
      /> */}
    </div>
  );
}

export default EditImageModal;

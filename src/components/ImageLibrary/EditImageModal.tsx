import React, { useEffect, useState } from "react";
import { type Image as IImage } from "@prisma/client";
import { useSession } from "next-auth/react";

import { FaTimes, FaEdit, FaCrop, FaTrash } from "react-icons/fa";

import isEqual from "lodash.isequal";

import dynamic from "next/dynamic";
import Select from "react-select";
import {
  type IFolderOptions,
  visibilityOptions,
} from "../ImageUpload/ImageReviewModal";
import Image from "next/image";

import CreateSelectable from "react-select/creatable";

import { trpc } from "../../utils/trpc";
import classes from "./EditImageModal.module.css";

const DynamicHeader = dynamic(() => import("../ImageUpload/ImageEditorModal"), {
  ssr: false,
});

interface IEditImageModal {
  image: IImage;
  setImageBeingEdited: React.Dispatch<React.SetStateAction<IImage | undefined>>;
}

function EditImageModal({ image, setImageBeingEdited }: IEditImageModal) {
  const { data: session } = useSession();
  const { data: allUserFolders } = trpc.images.getUserFolders.useQuery();
  const utils = trpc.useContext();

  const [editedImageData, setEditedImageData] = useState<IImage>(image);
  const [folderOptions, setFolderOptions] = useState<IFolderOptions[]>([]);

  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  // separate state for folder because image only has folderID, and we need both the id
  // and the title of the folder to be available in <CreateSelectable /> below
  const [currentFolderForImage, setCurrentFolderForImage] =
    useState<IFolderOptions | null>(null);
  const [newlyAddedFolderID, setNewlyAddedFolderID] = useState<string>();

  const [imageToBeEdited, setImageToBeEdited] = useState<IImage>();

  const [readyToUpdate, setReadyToUpdate] = useState<boolean>(false);

  const createFolder = trpc.images.createFolder.useMutation({
    onMutate: () => {
      utils.images.getUserFolders.cancel();
      const optimisticUpdate = utils.images.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.images.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSuccess(data) {
      if (data && data.id.length > 0) {
        setNewlyAddedFolderID(data.id);
      }
    },
    onSettled: () => {
      utils.images.getUserFolders.invalidate();
    },
  });

  const updateImageData = trpc.images.updateImageData.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      setImageBeingEdited(undefined);
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  const deleteImage = trpc.images.deleteImage.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      setImageBeingEdited(undefined);
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  useEffect(() => {
    if (allUserFolders && allUserFolders.length > 0) {
      const folderData: IFolderOptions[] = [];
      allUserFolders.map((folder) => {
        if (image.folderID === folder.id) {
          setCurrentFolderForImage(folder);
        }
        folderData.push({ id: folder.id, title: folder.title });
      });
      setFolderOptions(folderData);
    }
  }, [allUserFolders]);

  // probably redo these two effects later
  useEffect(() => {
    if (newlyAddedFolderID && newlyAddedFolderID.length > 0) {
      setReadyToUpdate(true);
      setNewlyAddedFolderID(undefined);
    }
  }, [newlyAddedFolderID]);

  useEffect(() => {
    if (readyToUpdate) {
      updateImageData.mutate({
        ...editedImageData,
        folderID:
          newlyAddedFolderID ?? currentFolderForImage?.id?.length
            ? currentFolderForImage?.id
            : null,
      });
      setReadyToUpdate(false);
    }
  }, [readyToUpdate, currentFolderForImage, editedImageData]);

  return (
    <div
      style={{
        opacity: image ? 1 : 0,
        pointerEvents: image ? "auto" : "none",
      }}
      className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-slate-800 transition-all"
    >
      <div className="relative flex max-w-[95vw] flex-col items-center justify-center gap-4 rounded-md bg-slate-400/75 p-10">
        <div
          className={`${classes.editImageDetailsGrid} rounded-md bg-slate-400 p-4`}
        >
          <div className={classes.titleLabel}>Title</div>
          <div className={classes.titleInput}>
            {editingTitle ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  className={`${classes.titleInput} w-full rounded-md pl-2 text-slate-700`}
                  type="text"
                  placeholder="Optional"
                  value={editedImageData.title ?? "Loading..."}
                  onChange={(e) => {
                    const newImageData = { ...editedImageData };
                    newImageData.title = e.target.value;
                    setEditedImageData(newImageData);
                  }}
                />
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const newImageData = { ...editedImageData };
                    newImageData.title = image.title;
                    setEditedImageData(newImageData);
                    setEditingTitle(false);
                  }}
                >
                  <FaTimes size={"1rem"} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-start gap-4">
                {image.title}
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingTitle(true)}
                >
                  <FaEdit size={"1rem"} />
                </button>
              </div>
            )}
          </div>
          <div className={classes.descriptionLabel}>Description</div>
          <div className={classes.descriptionInput}>
            {editingDescription ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  className={`${classes.descriptionInput} w-full rounded-md pl-2 text-slate-700`}
                  type="text"
                  placeholder="Optional"
                  value={editedImageData.description ?? "Loading..."}
                  onChange={(e) => {
                    const newImageData = { ...editedImageData };
                    newImageData.description = e.target.value;
                    setEditedImageData(newImageData);
                  }}
                />
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const newImageData = { ...editedImageData };
                    newImageData.description = image.description;
                    setEditedImageData(newImageData);
                    setEditingDescription(false);
                  }}
                >
                  <FaTimes size={"1rem"} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-start gap-4">
                {image.description}
                <button
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingDescription(true)}
                >
                  <FaEdit size={"1rem"} />
                </button>
              </div>
            )}
          </div>
          <div className={classes.folderLabel}>Folder</div>
          <div className={classes.FolderDropdownInput}>
            <CreateSelectable
              isClearable
              options={folderOptions}
              getOptionLabel={(options) => options.title}
              getOptionValue={(options) => options.id!} // may have to look at this again if a brand new folder is created
              onChange={(newFolder: IFolderOptions | null) => {
                setCurrentFolderForImage(newFolder);
              }}
              value={currentFolderForImage}
              placeholder="Optional"
            />
          </div>
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
              isDisabled={!session?.user?.id}
            />
          </div>
          <div className={classes.dateCreatedLabel}>Date uploaded</div>
          <div className={classes.dateCreatedValue}>
            {image.createdAt.toLocaleDateString()}
          </div>
          <div className={classes.linkLabel}>Link</div>
          <div className={classes.linkValue}>
            {/* click to copy here */}
            <a href={image.s3ImageURL} target="_blank" rel="noreferrer">
              {image.s3ImageURL}
            </a>
          </div>

          <button
            className={`${classes.editButton} flex items-center justify-center gap-4`}
            onClick={() => setImageToBeEdited(editedImageData)}
          >
            Edit image
            <FaCrop size={"1rem"} />
          </button>
          <button
            className={classes.saveButton}
            disabled={
              isEqual(image, editedImageData) &&
              image.folderID === currentFolderForImage?.id // start with making this work
                ? true
                : false
            }
            onClick={() => {
              // before updating, need to:
              // check if new folder was created + needs to be .created -> get newId -> folderID: newId
              if (
                currentFolderForImage &&
                typeof currentFolderForImage.id === "undefined" &&
                session?.user?.id
              ) {
                createFolder.mutate({
                  title: currentFolderForImage.title,
                  userID: session.user.id,
                });
              } else {
                setReadyToUpdate(true);
              }
            }}
          >
            Save
          </button>
          <button
            className={`${classes.deleteButton} flex items-center justify-center gap-4`}
            // should have a modal pop up that says "are you sure you want to delete this image?"
            onClick={() =>
              deleteImage.mutate({
                id: image.id,
              })
            }
          >
            Delete image
            <FaTrash size={"1rem"} />
          </button>
        </div>

        <Image
          src={image.s3ImageURL}
          alt={image.title ?? "uploaded image"}
          width={500}
          height={500}
        />
        <div
          className="absolute top-2 right-2 transition hover:opacity-50"
          onClick={() => setImageBeingEdited(undefined)}
        >
          <FaTimes size={"2rem"} style={{ cursor: "pointer" }} />
        </div>
      </div>

      {/* <DynamicHeader
        imageFile={imageToBeEdited?.s3ImageURL}
        setImageToBeEdited={setImageToBeEdited}
      /> */}
    </div>
  );
}

export default EditImageModal;

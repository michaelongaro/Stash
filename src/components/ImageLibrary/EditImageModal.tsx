import React, { useEffect, useState } from "react";
import { type Image as IImage } from "@prisma/client";
import { useSession } from "next-auth/react";

import { FaTimes, FaEdit, FaCrop, FaTrash } from "react-icons/fa";

import isEqual from "lodash.isequal";
import S3 from "aws-s3";

import { type IS3Response } from "../ImageUpload/UploadProgressModal";

import dynamic from "next/dynamic";
import Select from "react-select";
import { visibilityOptions } from "../ImageUpload/ImageReviewModal";
import Image from "next/image";
import { trpc } from "../../utils/trpc";
import CreateSelectable from "react-select/creatable";
import { type ICreateSelectableOptions } from "../ImageUpload/ImageReviewModal";

import classes from "./EditImageModal.module.css";

const config = {
  bucketName: "stash-resources",
  region: "us-east-2",
  accessKeyId: "AKIA3MXYY55AXMHDSQCJ",
  secretAccessKey: "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",
};

const S3Client = new S3(config);

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
  const [folderOptions, setFolderOptions] = useState<
    ICreateSelectableOptions[]
  >([]);
  // separate state for folder because image only has folderID, and we need both the id
  // and the title of the folder to be available in <CreateSelectable /> below
  const [currentlySelectedFolder, setCurrentlySelectedFolder] =
    useState<ICreateSelectableOptions | null>(null);

  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  const [newlyAddedFolderID, setNewlyAddedFolderID] = useState<string>();

  const [imageToBeEdited, setImageToBeEdited] = useState<string>(); // IImage

  const [readyToUpdate, setReadyToUpdate] = useState<boolean>(false);

  const [editedImageFile, setEditedImageFile] = useState<File>();

  const [showDiscardChangesModal, setShowDiscardChangesModal] =
    useState<boolean>(false);
  const [changesMade, setChangesMade] = useState<boolean>(false);

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
      const folderData: ICreateSelectableOptions[] = [];
      allUserFolders.map((folder) => {
        if (image.folderID === folder.id) {
          setCurrentlySelectedFolder({ value: folder.id, label: folder.title });
        }
        folderData.push({ value: folder.id, label: folder.title });
      });
      setFolderOptions(folderData);
    }
  }, [image, allUserFolders]);

  // probably redo these two effects later
  useEffect(() => {
    if (newlyAddedFolderID && newlyAddedFolderID.length > 0) {
      setReadyToUpdate(true);

      // try to use setState callback to set currentlySelectedFolder later
      if (currentlySelectedFolder?.label) {
        let prevFolderState = { ...currentlySelectedFolder };
        prevFolderState = {
          label: currentlySelectedFolder.label,
          value: newlyAddedFolderID,
        };
        setCurrentlySelectedFolder(prevFolderState);
      }

      // setNewlyAddedFolderID(undefined);
    }
  }, [currentlySelectedFolder, newlyAddedFolderID]);

  useEffect(() => {
    if (readyToUpdate) {
      // check if image was edited -> needs to be uploaded to s3 -> store new url in db
      if (editedImageFile) {
        S3Client.uploadFile(editedImageFile).then((res: IS3Response) => {
          updateImageData.mutate({
            ...editedImageData,
            folderID:
              newlyAddedFolderID ?? currentlySelectedFolder?.value?.length
                ? currentlySelectedFolder?.value
                : null,
            s3ImageURL: res.location,
          });
          setReadyToUpdate(false);
          setNewlyAddedFolderID(undefined); // necessary?
        });
      } else {
        updateImageData.mutate({
          ...editedImageData,
          folderID:
            newlyAddedFolderID ?? currentlySelectedFolder?.value?.length
              ? currentlySelectedFolder?.value
              : null,
        });
        setReadyToUpdate(false);
        setNewlyAddedFolderID(undefined); // necessary?
      }
    }
  }, [
    newlyAddedFolderID,
    readyToUpdate,
    currentlySelectedFolder,
    editedImageData,
    editedImageFile,
  ]);

  useEffect(() => {
    setChangesMade(
      !isEqual(image, editedImageData) ||
        image.folderID !== currentlySelectedFolder?.value ||
        editedImageFile !== undefined
    );
  }, [image, editedImageData, currentlySelectedFolder, editedImageFile]);

  return (
    <div
      style={{
        opacity: image ? 1 : 0,
        pointerEvents: image ? "auto" : "none",
      }}
      className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-blue-800/90 transition-all"
    >
      <div className="relative m-6 flex max-h-[95vh] max-w-[85vw] flex-col items-center justify-start gap-4 overflow-y-scroll rounded-md bg-blue-400/90 p-10">
        <div
          className={`${classes.editImageDetailsGrid} rounded-md bg-blue-300 p-4`}
        >
          <div className={classes.titleLabel}>Title</div>
          <div className={classes.titleInput}>
            {editingTitle ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  className={`${classes.titleInput} w-full rounded-md pl-2 `}
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
                  className="secondaryBtn"
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
                  className="secondaryBtn"
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
                  className={`${classes.descriptionInput} w-full rounded-md pl-2 `}
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
                  className="secondaryBtn"
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
                  className="secondaryBtn"
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
              styles={{
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  color: "#1e3a8a",
                }),
              }}
              options={folderOptions}
              onChange={(newFolder) => {
                if (newFolder?.label) {
                  // updating list of folders in dropdown
                  if (
                    folderOptions.every(
                      (elem) => elem.label !== newFolder.label
                    )
                  ) {
                    // making sure folder isn't already present)
                    const newFolderOptions = [...folderOptions];
                    newFolderOptions[newFolderOptions.length] = {
                      label: newFolder.label,
                      value: newFolder.value,
                    };
                    setFolderOptions(newFolderOptions);
                  }

                  setCurrentlySelectedFolder({
                    label: newFolder.label,
                    value:
                      newFolder.value !== newFolder.label
                        ? newFolder.value
                        : undefined,
                  });
                } else {
                  // want to uncomment below once you have functionality to fully delete folder from this menu
                  // (assuming you want that functionality)
                  // const newFolderOptions = [...folderOptions];
                  // delete newFolderOptions[index];
                  // setFolderOptions(newFolderOptions);

                  setCurrentlySelectedFolder(null);
                }
              }}
              value={currentlySelectedFolder}
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
            <a
              href={`${
                process.env.VERCEL_URL
                  ? `https://${process.env.VERCEL_URL}`
                  : `http://localhost:${process.env.PORT ?? 3000}`
              }/${image.randomizedURL}`}
              target="_blank"
              rel="noreferrer"
            >
              {`${
                process.env.VERCEL_URL
                  ? `https://${process.env.VERCEL_URL}`
                  : `http://localhost:${process.env.PORT ?? 3000}`
              }/${image.randomizedURL}`}
            </a>
          </div>

          <button
            className={`${classes.editButton} secondaryBtn flex items-center justify-center gap-4`}
            onClick={() => setImageToBeEdited(image.s3ImageURL)}
          >
            Edit image
            <FaCrop size={"1rem"} />
          </button>
          <button
            className={`${classes.saveButton} primaryBtn`}
            disabled={!changesMade}
            onClick={() => {
              // before updating, need to:
              // check if new folder was created -> needs to be .created -> get newId -> folderID: newId
              if (
                currentlySelectedFolder &&
                typeof currentlySelectedFolder.value === "undefined" &&
                session?.user?.id
              ) {
                createFolder.mutate({
                  title: currentlySelectedFolder.label,
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
            className={`${classes.deleteButton} dangerBtn flex items-center justify-center gap-4`}
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

        <div className="relative flex h-full w-full items-center justify-center">
          {editedImageFile && (
            <div className="absolute top-2 right-2 rounded-md bg-blue-50 p-2 text-red-500">
              edited image will be shown once changes are saved*
            </div>
          )}
          <Image
            src={image.s3ImageURL}
            alt={image.title ?? "uploaded image"}
            width={500}
            height={500}
          />
        </div>
        <button
          className="absolute top-2 right-2 transition hover:opacity-50"
          onClick={() => {
            if (changesMade) {
              setShowDiscardChangesModal(true);
            } else {
              setImageBeingEdited(undefined);
            }
          }}
        >
          <FaTimes size={"2rem"} style={{ cursor: "pointer" }} />
        </button>
      </div>

      <DynamicHeader
        imageToBeEdited={imageToBeEdited}
        setImageToBeEdited={setImageToBeEdited}
        setEditedImageFile={setEditedImageFile}
      />

      {showDiscardChangesModal && (
        <div className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-blue-800/90 transition-all">
          <div className="relative flex h-full flex-col items-center justify-center gap-4 rounded-md bg-blue-400 p-8">
            <div className="item-center flex flex-col justify-center gap-2 ">
              <div className="text-center">
                Exiting the editor will discard any changes you&apos;ve made.
              </div>
              <div className="text-center">Are you sure you want to exit?</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                className="primaryBtn"
                onClick={() => {
                  setShowDiscardChangesModal(false);
                }}
              >
                Continue editing
              </button>
              <button
                className="secondaryBtn"
                onClick={() => {
                  setImageBeingEdited(undefined);
                }}
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditImageModal;

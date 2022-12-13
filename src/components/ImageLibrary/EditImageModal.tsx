import React, { useEffect, useState, useRef } from "react";
import { type Image as IImage } from "@prisma/client";
import { useSession } from "next-auth/react";

import {
  FaTimes,
  FaEdit,
  FaCrop,
  FaTrash,
  FaExternalLinkAlt,
} from "react-icons/fa";

import isEqual from "lodash.isequal";
import S3 from "aws-s3";

import { type IS3Response } from "../ImageUpload/UploadProgressModal";

import dynamic from "next/dynamic";
import Select from "react-select";
import { visibilityOptions } from "../ImageUpload/ImageReviewModal";
import Image from "next/image";
import { trpc } from "../../utils/trpc";
import CreateSelectable from "react-select/creatable";
import { type IFolderOptions } from "../ImageUpload/ImageReviewModal";
import { motion, AnimatePresence } from "framer-motion";

import classes from "./EditImageModal.module.css";
import { dropIn } from "../../utils/framerMotionDropInStyles";
import useOnClickOutside from "../../hooks/useOnClickOutside";
import useScrollModalIntoView from "../../hooks/useScrollModalIntoView";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";
import { useLocalStorageContext } from "../../context/LocalStorageContext";

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
  const localStorageID = useLocalStorageContext();
  const { data: session } = useSession();
  const { data: allUserFolders } = trpc.folders.getUserFolders.useQuery(
    localStorageID?.value ?? session?.user?.id
  );
  const utils = trpc.useContext();

  const [editedImageData, setEditedImageData] = useState<IImage>(image);
  const [folderOptions, setFolderOptions] = useState<IFolderOptions[]>([]);

  // state for CreateSelectable value
  const [currentlySelectedFolder, setCurrentlySelectedFolder] =
    useState<IFolderOptions | null>(null);

  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  const [newlyAddedFolderID, setNewlyAddedFolderID] = useState<string>();

  const [imageToBeEdited, setImageToBeEdited] = useState<string>(); // IImage

  const [readyToUpdate, setReadyToUpdate] = useState<boolean>(false);

  const [editedImageFile, setEditedImageFile] = useState<File>();

  const [showDiscardChangesModal, setShowDiscardChangesModal] =
    useState<boolean>(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] =
    useState<boolean>(false);
  const [changesMade, setChangesMade] = useState<boolean>(false);

  const editImageDetailsRef = useRef<HTMLDivElement>(null);

  const userID = localStorageID?.value ?? session?.user?.id;

  const createFolder = trpc.folders.createFolder.useMutation({
    onMutate: () => {
      utils.folders.getUserFolders.cancel();
      const optimisticUpdate = utils.folders.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.folders.getUserFolders.setData(optimisticUpdate);
      }
    },
    onSuccess(data) {
      if (data && data.id.length > 0) {
        setNewlyAddedFolderID(data.id);
      }
    },
    onSettled: () => {
      utils.folders.getUserFolders.invalidate();
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
      utils.images.retrieveImageFromFolder.invalidate();
      setImageBeingEdited(undefined);
    },
  });

  useEffect(() => {
    if (allUserFolders && allUserFolders.length > 0) {
      const folderData: IFolderOptions[] = [];
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
        // would ideally like to change this logic below
        (currentlySelectedFolder === null && image.folderID !== null) ||
        (currentlySelectedFolder !== null &&
          image.folderID !== currentlySelectedFolder.value) ||
        editedImageFile !== undefined
    );
  }, [image, editedImageData, currentlySelectedFolder, editedImageFile]);

  useScrollModalIntoView();

  useOnClickOutside({
    ref: editImageDetailsRef,
    setter: setImageBeingEdited,
    backupSetter: setShowDiscardChangesModal,
    hideModalValue: undefined,
    backupHideModalValue: true,
    useBackupSetter: changesMade,
  });

  return (
    <motion.div
      key={image.randomizedURL}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-blue-800/90 transition-all"
    >
      <motion.div
        key={image.id}
        ref={editImageDetailsRef}
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative m-6 
        flex max-h-[95vh] flex-col items-center
        justify-start gap-4 overflow-y-scroll rounded-md bg-blue-500/90 p-[0.5rem] pt-12 pb-4 sm:max-w-[95vw] sm:p-10 lg:max-w-[85vw]"
      >
        <div
          className={`${classes.editImageDetailsGrid} rounded-md bg-blue-400/90 p-4`}
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
          <div className={classes.folderDropdownInput}>
            <CreateSelectable
              isClearable
              styles={{
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  color: "#1e3a8a",
                }),
              }}
              formatCreateLabel={(inputValue) =>
                `Create folder "${inputValue}"`
              }
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
                    value: newFolder.value,
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
              styles={{
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  color: "#1e3a8a",
                }),
              }}
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
              isSearchable={false}
              isDisabled={!userID}
            />
          </div>
          <div className={classes.dateCreatedLabel}>Date uploaded</div>
          <div className={classes.dateCreatedValue}>
            {image.createdAt.toLocaleDateString()}
          </div>
          <div className={classes.linkLabel}>Link</div>
          <div className={classes.linkValue}>
            <a
              href={`${window.location}${image.randomizedURL}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="flex items-center justify-center gap-2 underline underline-offset-4">
                {`${window.location}${image.randomizedURL}`}
                <FaExternalLinkAlt size={"1rem"} />
              </div>
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
                currentlySelectedFolder.value ===
                  currentlySelectedFolder.label &&
                userID
              ) {
                createFolder.mutate({
                  title: currentlySelectedFolder.label,
                  userID: userID,
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
            onClick={() => setShowConfirmDeleteModal(true)}
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
            className="rounded-md shadow-lg" // h-auto w-full
            src={image.s3ImageURL}
            alt={image?.title ?? "uploaded image"}
            width={500} // this will have to be caluclated based on screen width/individual grid cell size...
            height={500} // this will have to be caluclated based on screen width/individual grid cell size...
            placeholder={"blur"}
            blurDataURL={
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzkwIiBoZWlnaHQ9IjQxMyIgdmlld0JveD0iMCAwIDM5MCA0MTMiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSIjMUUxRTFFIi8+CjxyZWN0IHdpZHRoPSIzOTAiIGhlaWdodD0iNDEzIiBmaWxsPSJ3aGl0ZSIvPgo8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzBfMSkiPgo8cGF0aCBkPSJNMTMwLjUgMjY1TDE2Mi41IDE5OS4yNUwxOTQuNSAxMzMuNUwyNTkuNSAyNjUiIHN0cm9rZT0iIzFENEVEOCIgc3Ryb2tlLXdpZHRoPSIyNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPGRlZnM+CjxmaWx0ZXIgaWQ9ImZpbHRlcjBfZF8wXzEiIHg9IjExMy45OTciIHk9IjEyMSIgd2lkdGg9IjE2Mi4wMDYiIGhlaWdodD0iMTY0LjUwMyIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxMjcgMCIgcmVzdWx0PSJoYXJkQWxwaGEiLz4KPGZlT2Zmc2V0IGR5PSI0Ii8+CjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjIiLz4KPGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+CjxmZUNvbG9yTWF0cml4IHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjI1IDAiLz4KPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJlZmZlY3QxX2Ryb3BTaGFkb3dfMF8xIi8+CjxmZUJsZW5kIG1vZGU9Im5vcm1hbCIgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iZWZmZWN0MV9kcm9wU2hhZG93XzBfMSIgcmVzdWx0PSJzaGFwZSIvPgo8L2ZpbHRlcj4KPC9kZWZzPgo8L3N2Zz4K"
            }
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

        <DynamicHeader
          imageToBeEdited={imageToBeEdited}
          setImageToBeEdited={setImageToBeEdited}
          setEditedImageFile={setEditedImageFile}
        />

        <AnimatePresence
          initial={false}
          mode={"wait"}
          onExitComplete={() => null}
        >
          {showDiscardChangesModal && (
            <motion.div
              key={image.userID}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 z-[500] flex h-full w-full items-center justify-center bg-blue-700/70 transition-all"
            >
              <motion.div
                key={image.title}
                variants={dropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative flex flex-col items-center justify-center gap-4 rounded-md bg-blue-400 p-8"
              >
                <div className="item-center flex flex-col justify-center gap-2 ">
                  <div className="text-center">
                    Exiting the editor will discard any changes you&apos;ve
                    made.
                  </div>
                  <div className="text-center">
                    Are you sure you want to exit?
                  </div>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence
          initial={false}
          mode={"wait"}
          onExitComplete={() => null}
        >
          {showConfirmDeleteModal && (
            <ConfirmDeleteModal
              type={"image"}
              setShowConfirmDeleteModal={setShowConfirmDeleteModal}
              idsToDelete={[image.id]}
              afterImageDeletionCallback={setImageBeingEdited}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default EditImageModal;

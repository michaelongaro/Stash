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
import base64Logo from "../../utils/base64Logo";
import { toastNotification } from "../../utils/toastNotification";
import LoadingDots from "../loadingAssets/LoadingDots";
import useKeepFocusInModal from "../../hooks/useKeepFocusInModal";

const DynamicHeader = dynamic(() => import("../ImageUpload/ImageEditorModal"), {
  ssr: false,
});

export interface IS3ClientOptions {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

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

  const { data: s3Details } = trpc.metadataRouter.getAWSS3SecretKeys.useQuery();

  const [s3Config, setS3Config] = useState<IS3ClientOptions>();

  useEffect(() => {
    if (s3Details && s3Details.accessKeyId && s3Details.secretAccessKey) {
      setS3Config({
        bucketName: "stash-resources",
        region: "us-east-2",
        accessKeyId: s3Details.accessKeyId,
        secretAccessKey: s3Details.secretAccessKey,
      });
    }
  }, [s3Details]);

  const [editedImageData, setEditedImageData] = useState<IImage>(image);
  const [folderOptions, setFolderOptions] = useState<IFolderOptions[]>([]);

  // state for CreateSelectable value
  const [currentlySelectedFolder, setCurrentlySelectedFolder] =
    useState<IFolderOptions | null>(null);

  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [editingDescription, setEditingDescription] = useState<boolean>(false);

  const [imageToBeEdited, setImageToBeEdited] = useState<string>(); // IImage

  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [readyToUpdate, setReadyToUpdate] = useState<boolean>(false);

  const [editedImageFile, setEditedImageFile] = useState<File>();

  const [showDiscardChangesModal, setShowDiscardChangesModal] =
    useState<boolean>(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] =
    useState<boolean>(false);
  const [changesMade, setChangesMade] = useState<boolean>(false);

  const editTitleInputRef = useRef<HTMLInputElement>(null);
  const editDescriptionInputRef = useRef<HTMLInputElement>(null);
  const editImageDetailsRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
        if (currentlySelectedFolder?.label) {
          let prevFolderState = { ...currentlySelectedFolder };
          prevFolderState = {
            label: currentlySelectedFolder.label,
            value: data.id,
          };
          setCurrentlySelectedFolder(prevFolderState);
        }
        setCreatingFolder(false);
        setReadyToUpdate(true);
      }
    },
    onSettled: () => {
      utils.folders.getUserFolders.invalidate();
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
      setReadyToUpdate(false);
      toastNotification("Image details updated");
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

  useEffect(() => {
    if (readyToUpdate) {
      // check if image was edited -> needs to be uploaded to s3 -> store new url in db
      if (editedImageFile && s3Config) {
        const S3Client = new S3(s3Config);
        S3Client.uploadFile(editedImageFile).then((res: IS3Response) => {
          updateImageData.mutate({
            ...editedImageData,
            folderID: currentlySelectedFolder?.value?.length
              ? currentlySelectedFolder?.value
              : null,
            s3ImageURL: res.location,
          });
        });
      } else {
        updateImageData.mutate({
          ...editedImageData,
          folderID: currentlySelectedFolder?.value?.length
            ? currentlySelectedFolder?.value
            : null,
        });
      }
    }
  }, [
    // newlyAddedFolderID,
    readyToUpdate,
    currentlySelectedFolder,
    editedImageData,
    editedImageFile,
    s3Config,
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
  useKeepFocusInModal({
    modalRef: editImageDetailsRef,
    firstElemRef: firstButtonRef,
    lastElemRef: lastButtonRef,
    closeButtonRef: closeButtonRef,
  });
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
      className="fixed top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] justify-center bg-blue-800/90 transition-all sm:items-center"
    >
      <motion.div
        key={image.id}
        ref={editImageDetailsRef}
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative m-6 
        flex max-h-[87vh] flex-col items-center justify-start
        gap-4 overflow-y-auto rounded-md bg-blue-500/90 p-[0.5rem] pt-12 sm:max-h-[95vh] sm:max-w-[95vw] sm:p-10 lg:max-w-[85vw]"
      >
        <div
          className={`${classes.editImageDetailsGrid} rounded-md bg-blue-400/90 p-4`}
        >
          <div className={classes.titleLabel}>Title</div>
          <div className={classes.titleInput}>
            {editingTitle ? (
              <div className="flex items-center justify-center gap-4">
                <input
                  ref={editTitleInputRef}
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
                  aria-label="Cancel"
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
                {image.title ? (
                  image.title
                ) : (
                  <div className="italic text-blue-50/70">
                    (No title provided)
                  </div>
                )}
                <button
                  ref={firstButtonRef}
                  className="secondaryBtn"
                  aria-label="Edit"
                  onClick={() => {
                    setEditingTitle(true);
                    setTimeout(() => editTitleInputRef.current?.focus(), 1);
                  }}
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
                  ref={editDescriptionInputRef}
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
                  aria-label="Cancel"
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
                {image.description ? (
                  image.description
                ) : (
                  <div className="italic text-blue-50/70">
                    (No description provided)
                  </div>
                )}
                <button
                  className="secondaryBtn"
                  aria-label="Edit"
                  onClick={() => {
                    setEditingDescription(true);
                    setTimeout(
                      () => editDescriptionInputRef.current?.focus(),
                      1
                    );
                  }}
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
            className={`${classes.saveButton} primaryBtn`}
            aria-label="Save Changes"
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
                setCreatingFolder(true);
                createFolder.mutate({
                  title: currentlySelectedFolder.label,
                  userID: userID,
                });
              } else {
                setReadyToUpdate(true);
              }
            }}
          >
            {readyToUpdate || creatingFolder ? (
              <LoadingDots width={48} height={24} radius={15} />
            ) : (
              "Save"
            )}
          </button>
          <button
            className={`${classes.editButton} secondaryBtn flex items-center justify-center gap-4`}
            aria-label="Edit Image"
            onClick={() => setImageToBeEdited(image.s3ImageURL)}
          >
            Edit image
            <FaCrop size={"1rem"} />
          </button>
          <button
            ref={lastButtonRef}
            className={`${classes.deleteButton} dangerBtn flex items-center justify-center gap-4`}
            aria-label="Delete Image"
            onClick={() => setShowConfirmDeleteModal(true)}
          >
            Delete image
            <FaTrash size={"1rem"} />
          </button>
        </div>

        <div className="relative flex h-full w-full items-center justify-center pb-6">
          {editedImageFile && (
            <div className="absolute top-2 right-2 rounded-md bg-blue-50 p-2 text-red-500">
              edited image will be shown once changes are saved*
            </div>
          )}

          <Image
            blurDataURL={image.blurredImageData ?? base64Logo}
            className="h-auto w-auto rounded-md shadow-lg"
            src={image.s3ImageURL}
            alt={image?.title ?? "uploaded image"}
            width={500}
            height={500}
            priority={true}
            placeholder={"blur"}
          />
        </div>
        <button
          ref={closeButtonRef}
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
                    aria-label="continue editing"
                    onClick={() => {
                      setShowDiscardChangesModal(false);
                    }}
                  >
                    Continue editing
                  </button>
                  <button
                    className="secondaryBtn"
                    aria-label="discard changes"
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

import React, { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import DragAndDrop, { type IImage } from "./DragAndDrop";
import Slideshow from "./Slideshow";
import dynamic from "next/dynamic";
import Select from "react-select";
import CreateSelectable from "react-select/creatable";

import classes from "./ImageReviewModal.module.css";
import ImageEditorModal from "./ImageEditorModal";
import UploadProgressModal from "./UploadProgressModal";
import { trpc } from "../../utils/trpc";
import isEqual from "lodash.isequal";
import { FaCrop, FaTimes, FaTrash } from "react-icons/fa";

interface IFileProps {
  files: IImage[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
}

export interface IFile {
  image: IImage;
  title: string;
  description: string;
  isPublic: boolean;
  folder?: IFolderOptions;
}

export interface IFolderOptions {
  title: string;
  id?: string;
}

interface ICreateSelectableOptions {
  // workaround for CreateSelectable type issues
  value?: string;
  label: string;
}

export interface IVisibilityOptions {
  label: string;
  value: boolean;
}

export const visibilityOptions: IVisibilityOptions[] = [
  { label: "Public", value: true },
  { label: "Private", value: false },
];

const DynamicHeader = dynamic(() => import("./ImageEditorModal"), {
  ssr: false,
});

function ImageReviewModal({ files, setFiles }: IFileProps) {
  const { data: session } = useSession();
  const { data: allUserFolders } = trpc.images.getUserFolders.useQuery();

  const [imageData, setImageData] = useState<IFile[]>([]);
  const [folderOptions, setFolderOptions] = useState<
    ICreateSelectableOptions[]
  >([]);
  const [createSelectableFolders, setCreateSelectableFolders] = useState<
    ICreateSelectableOptions[]
  >([]); // workaround for CreateSelectable type issues

  const [index, setIndex] = useState<number>(0);
  const [startUploadOfImages, setStartUploadOfImages] =
    useState<boolean>(false);

  const [imageToBeEdited, setImageToBeEdited] = useState<File>();

  useEffect(() => {
    if (files.length > 0) {
      // maybe have && files.length !== imageData.length ?
      const newImageData: IFile[] = [...imageData];
      files.map((file, idx) => {
        if (!isEqual(imageData[idx]?.image, file)) {
          newImageData.push({
            image: file,
            title: "",
            description: "",
            isPublic: true,
          });
        }
      });
      if (!isEqual(imageData, newImageData)) {
        setImageData(newImageData); // might still be source of infinite rerender
      }
    }
  }, [files, imageData]);

  // temporary:
  useEffect(() => {
    if (files.length > 0) {
      document.body.style.overflow = "hidden";
    }
  }, [files]);

  useEffect(() => {
    if (allUserFolders && allUserFolders.length > 0) {
      const folderData: ICreateSelectableOptions[] = [];
      allUserFolders.map((folder) => {
        folderData.push({ value: folder.id, label: folder.title });
      });
      setFolderOptions(folderData);
    }
  }, [allUserFolders]);

  return (
    <div
      style={{
        opacity: files.length !== 0 ? 1 : 0,
        pointerEvents: files.length !== 0 ? "auto" : "none",
      }}
      className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-blue-800/90 transition-all"
    >
      {imageData.length !== 0 && !startUploadOfImages && (
        <div className={`${classes.modalGrid} relative bg-blue-400/90`}>
          <div className={`${classes.preview} flex items-end justify-center`}>
            Preview
          </div>
          <div className={`${classes.imageNumbers} flex items-end`}>{`(${
            index + 1
          } of ${files.length})`}</div>
          <button
            className={`${classes.editButton} secondaryBtn flex items-center justify-center gap-4`}
            onClick={() =>
              setImageToBeEdited(imageData[index]?.image.imageFile)
            }
          >
            Edit image
            <FaCrop size={"1rem"} />
          </button>

          <button
            className={`${classes.upload} primaryBtn`}
            onClick={() => setStartUploadOfImages(true)}
          >
            {`Upload${files.length > 1 ? " all" : ""}`}
          </button>
          <div className={classes.slideshow}>
            <Slideshow files={files} index={index} setIndex={setIndex} />
          </div>
          <div className={classes.filenameLabel}>Name</div>
          <div className={classes.filename}>{imageData[index]?.image.name}</div>
          <div className={classes.lastModifiedLabel}>Last modified</div>
          <div className={classes.lastModified}>
            {imageData[index]?.image.lastModified}
          </div>
          <div className={classes.fileSizeLabel}>Size</div>
          <div className={classes.fileSize}>{imageData[index]?.image.size}</div>
          <div className={classes.titleLabel}>Title</div>
          <input
            className={`${classes.titleInput} rounded-md pl-2 `}
            type="text"
            placeholder="Optional"
            value={imageData[index]?.title}
            onChange={(e) => {
              const newImageData = [...imageData];
              newImageData[index]!.title = e.target.value;
              setImageData(newImageData);
            }}
          />
          <div className={classes.descriptionLabel}>Description</div>
          <input
            className={`${classes.descriptionInput} rounded-md pl-2 `}
            type="text"
            placeholder="Optional"
            value={imageData[index]?.description}
            onChange={(e) => {
              const newImageData = [...imageData];
              newImageData[index]!.description = e.target.value;
              setImageData(newImageData);
            }}
          />

          <button
            className={`${classes.removeImageFromUploadButton} dangerBtn flex items-center justify-center gap-2`}
            onClick={() => {
              setFiles((currentFiles) =>
                currentFiles.filter((value, i) => i !== index)
              );
              setImageData((currentImageData) =>
                currentImageData.filter((value, i) => i !== index)
              );
            }}
          >
            <FaTrash size={"1rem"} />
            Remove image from upload
          </button>

          <div className={classes.folderLabel}>Folder</div>
          <div className={classes.folderDropdown}>
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
                  const newImageData = [...imageData];
                  newImageData[index]!.folder = {
                    title: newFolder.label,
                    id:
                      newFolder.value !== newFolder.label
                        ? newFolder.value
                        : undefined,
                  };
                  setImageData(newImageData);

                  const newFolderData = [...createSelectableFolders];
                  newFolderData[index] = {
                    label: newFolder.label,
                    value: newFolder.value,
                  };
                  setCreateSelectableFolders(newFolderData);
                } else {
                  const newImageData = [...imageData];
                  delete newImageData[index]?.folder;
                  setImageData(newImageData);

                  const newFolderData = [...createSelectableFolders];
                  delete newFolderData[index];
                  setCreateSelectableFolders(newFolderData);
                }
              }}
              value={createSelectableFolders[index]}
              placeholder="Optional"
            />
          </div>
          <div className={classes.visibilityLabel}>Visibility</div>
          <div className={classes.visibilityDropdown}>
            <Select
              options={visibilityOptions}
              styles={{
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  color: "#1e3a8a",
                }),
              }}
              onChange={(e) => {
                const newImageData = [...imageData];
                newImageData[index]!.isPublic = e!.value;
                setImageData(newImageData);
              }}
              value={
                imageData[index]?.isPublic
                  ? { label: "Public", value: true }
                  : { label: "Private", value: false }
              }
              isDisabled={!session?.user?.id}
            />
          </div>

          {/* for prev/next buttons, log out what happens to index state when changing images
          i think it is -1 0 1 so might have to do some quirky logic */}
          <button className={`${classes.previousButton} secondaryBtn`}>
            Prev
          </button>
          <div className={classes.dragAndDropUpload}>
            <DragAndDrop
              // maybe need a key here?
              containerWidth={"100%"}
              containerHeight={"100%"}
              containerBorderRadius={"0.375rem"}
              dragAndDropWidth={"98%"}
              dragAndDropHeight={"90%"}
              dragAndDropBorderRadius={"0.375rem"}
              files={files}
              setFiles={setFiles}
              usedInReviewModal={true}
            />
          </div>
          <button className={`${classes.nextButton} secondaryBtn`}>Next</button>

          <div
            className="absolute top-2 right-2 transition hover:opacity-50"
            onClick={() => {
              document.body.style.overflow = "auto";
              setFiles([]);
            }}
          >
            <FaTimes size={"2rem"} style={{ cursor: "pointer" }} />
          </div>
        </div>
      )}

      {/* upload progress modal */}
      {startUploadOfImages && (
        <UploadProgressModal files={imageData} setFiles={setFiles} />
      )}

      <DynamicHeader
        imageFile={imageToBeEdited}
        setImageToBeEdited={setImageToBeEdited}
      />
    </div>
  );
}

export default ImageReviewModal;

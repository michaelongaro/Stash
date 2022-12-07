import React, { useEffect, useState, useRef } from "react";

import { useSession } from "next-auth/react";

import DragAndDrop, { type IImage } from "./DragAndDrop";
import { Slideshow } from "./Slideshow";
import { type SlideshowRef } from "react-slideshow-image";
import dynamic from "next/dynamic";
import Select from "react-select";

import classes from "./ImageReviewModal.module.css";
import UploadProgressModal from "./UploadProgressModal";
import { trpc } from "../../utils/trpc";
import isEqual from "lodash.isequal";
import { FaCrop, FaTimes, FaTrash } from "react-icons/fa";
import CreateableFolderDropdown from "./CreateableFolderDropdown";

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

export interface ICreateSelectableOptions {
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

  const slideRef = useRef<SlideshowRef>(null);

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

  const changeIndex = (moveForwardInArray: boolean) => {
    if (moveForwardInArray) {
      if (index < imageData.length - 1) {
        setIndex((currentIndex) => currentIndex + 1);
      } else {
        setIndex(0);
      }
      slideRef.current?.goNext();
    } else {
      if (index > 0) {
        setIndex((currentIndex) => currentIndex - 1);
      } else {
        setIndex(imageData.length - 1);
      }
      slideRef.current?.goBack();
    }
  };

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
            <Slideshow
              ref={slideRef}
              files={files}
              index={index}
              setIndex={setIndex}
            />
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
            <CreateableFolderDropdown
              index={index}
              folderOptions={folderOptions}
              setFolderOptions={setFolderOptions}
              createSelectableFolders={createSelectableFolders}
              setCreateSelectableFolders={setCreateSelectableFolders}
              imageData={imageData}
              setImageData={setImageData}
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

          <button
            className={`${classes.previousButton} secondaryBtn`}
            onClick={() => changeIndex(false)}
          >
            Prev
          </button>
          <div className={classes.dragAndDropUpload}>
            <DragAndDrop
              // maybe need a key here?
              renderedLocation={"reviewModal"}
              files={files}
              setFiles={setFiles}
              usedInReviewModal={true}
            />
          </div>
          <button
            className={`${classes.nextButton} secondaryBtn`}
            onClick={() => changeIndex(true)}
          >
            Next
          </button>

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
        imageToBeEdited={imageToBeEdited}
        setImageToBeEdited={setImageToBeEdited}
        setImageData={setImageData}
        index={index}
      />
    </div>
  );
}

export default ImageReviewModal;

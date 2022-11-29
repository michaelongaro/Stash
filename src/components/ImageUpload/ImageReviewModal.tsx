import React, { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import DragAndDrop, { type IImage } from "./DragAndDrop";
import Slideshow from "./Slideshow";
import dynamic from "next/dynamic";
import Select, { ActionMeta } from "react-select";
import CreateSelectable from "react-select/creatable";

import classes from "./ImageReviewModal.module.css";
import ImageEditorModal from "./ImageEditorModal";
import UploadProgressModal from "./UploadProgressModal";
import { trpc } from "../../utils/trpc";

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

interface IFolderOptions {
  title: string;
  id?: string;
}

// const folderOptions: IFolderOptions[] = [];

// change/split this up later
interface IVisibilityOptions {
  label: string;
  value: boolean;
}

const visibilityOptions: IVisibilityOptions[] = [
  { label: "Public", value: true },
  { label: "Private", value: false },
];

const DynamicHeader = dynamic(() => import("./ImageEditorModal"), {
  ssr: false,
});

function ImageReviewModal({ files, setFiles }: IFileProps) {
  const { data } = trpc.images.getUserFolders.useQuery(); // look up .useQuery here

  const [imageData, setImageData] = useState<IFile[]>([]);
  const [folderOptions, setFolderOptions] = useState<IFolderOptions[]>([]);
  // const [folder, setFolder] = useState<IFolderOptions>();

  const [index, setIndex] = useState<number>(0);
  const [startUploadOfImages, setStartUploadOfImages] =
    useState<boolean>(false);

  const [imageToBeEdited, setImageToBeEdited] = useState<File>();

  useEffect(() => {
    if (files.length > 0) {
      const newImageData: IFile[] = [];
      files.map((file) => {
        newImageData.push({
          image: file,
          title: "",
          description: "",
          isPublic: true,
        });
      });
      setImageData(newImageData);
    }
  }, [files]);

  useEffect(() => {
    if (data && data.length > 0) {
      const folderData: IFolderOptions[] = [];
      data.map((folder) => {
        folderData.push({ id: folder.id, title: folder.title });
      });
      setFolderOptions(folderData);
    }
  }, [data]);

  // const onChange = (
  //   option: IFolderOptions | null,
  //   actionMeta: ActionMeta<IFolderOptions>
  // ) => {
  //   console.log("newFolder value:", option);

  //   const newImageData = [...imageData];
  //   // creating folder object + scaffolding
  //   newImageData[index]!.folder = { title: option!.title };
  //   // newImageData[index]!.folder!.title = newFolder!.title;
  //   setImageData(newImageData);
  // };

  // const [showModal, setShowModal] = useState<boolean>(true)

  return (
    <div
      style={{
        opacity: files.length !== 0 ? 1 : 0,
        pointerEvents: files.length !== 0 ? "auto" : "none",
      }}
      className="absolute top-0 left-0 flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-slate-800 transition-all"
    >
      {imageData.length !== 0 && !startUploadOfImages && (
        <div className={classes.modalGrid}>
          <div className={classes.preview}>Preview</div>
          <div className={classes.imageNumbers}>{`(${index + 1} of ${
            files.length
          })`}</div>
          <button
            className={classes.edit}
            onClick={() =>
              setImageToBeEdited(imageData[index]?.image.imageFile)
            }
          >
            Edit
          </button>

          {/* will most likely have to move the location of this, uncomment later */}

          {/* <DynamicHeader imageFile={imageToBeEdited} /> */}

          <button
            className={classes.upload}
            onClick={() => setStartUploadOfImages(true)}
          >
            Upload
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
            className={`${classes.titleInput} rounded-md pl-2 text-slate-700`}
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
            className={`${classes.descriptionInput} rounded-md pl-2 text-slate-700`}
            type="text"
            placeholder="Optional"
            value={imageData[index]?.description}
            onChange={(e) => {
              const newImageData = [...imageData];
              newImageData[index]!.description = e.target.value;
              setImageData(newImageData);
            }}
          />
          <div className={classes.folderLabel}>Folder</div>
          <div className={classes.folderDropdown}>
            <CreateSelectable
              isClearable
              options={folderOptions}
              // returns {value: string, ...} when what you need is {title: string}
              // modifying this isn't particularly easy, ideally don't want to change interface
              // type to be value instead of title..
              onChange={(newFolder) => {
                const newImageData = [...imageData];
                newImageData[index]!.folder = { title: newFolder!.title };
                setImageData(newImageData);
              }}
              // onChange={onChange}
              // onCreateOption={(inputValue) => setFolder({ title: inputValue })}
              value={imageData[index]?.folder}
              placeholder="Optional"
            />
          </div>
          <div className={classes.visibilityLabel}>Visibility</div>
          <div className={classes.visibilityDropdown}>
            <Select
              options={visibilityOptions}
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
            />
          </div>

          {/* for prev/next buttons, log out what happens to index state when changing images
          i think it is -1 0 1 so might have to do some quirky logic */}
          <button className={classes.previousButton}>Prev</button>
          <div className={classes.dragAndDropUpload}>
            {/* this is a jhinception! will have to catch and handle any new images differently */}
            <DragAndDrop />
          </div>
          <button className={classes.nextButton}>Next</button>
        </div>
      )}

      {/* upload progress modal */}
      {startUploadOfImages && (
        <UploadProgressModal files={imageData} setFiles={setFiles} />
      )}
    </div>
  );
}

export default ImageReviewModal;

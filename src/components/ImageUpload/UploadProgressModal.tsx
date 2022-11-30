import React, { useState, useEffect } from "react";
import S3 from "aws-s3";
import { trpc } from "../../utils/trpc";

import cryptoRandomString from "crypto-random-string";

import { type IFile } from "./ImageReviewModal";
import { type IImage } from "./DragAndDrop";
import { useSession } from "next-auth/react";

const config = {
  bucketName: "stash-resources",
  region: "us-east-2",
  accessKeyId: "AKIA3MXYY55AXMHDSQCJ",
  secretAccessKey: "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",
};

const S3Client = new S3(config);

interface IUploadProgressModal {
  files: IFile[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
}

function UploadProgressModal({ files, setFiles }: IUploadProgressModal) {
  const { data: session, status } = useSession();
  const utils = trpc.useContext();

  const [s3URLs, setS3URLs] = useState<string[]>([]);
  const [uploadsHaveStarted, setUploadsHaveStarted] = useState<boolean>(false);

  const [fileIndex, setFileIndex] = useState<number>(0);
  const [newlyAddedFolderID, setNewlyAddedFolderID] = useState<string>();
  const [numImagesInsertedIntoDatabase, setNumImagesInsertedIntoDatabase] =
    useState<number>(0);

  // destroys component when all images are inside the database
  if (numImagesInsertedIntoDatabase === files.length) {
    setFiles([]);
  }

  // optimistic updating
  const addImage = trpc.images.addImage.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSuccess() {
      setNumImagesInsertedIntoDatabase((prevNum) => prevNum + 1);
      setFileIndex((index) => index + 1);
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
    },
  });

  // could probably export this and not have to repeat in <EditImageModal />
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

  // currently uploading the image(s) twice... has to be from useEffect below but not
  // sure exactly what is causing that
  interface IS3Response {
    bucket: string;
    key: string;
    location: string;
  }

  useEffect(() => {
    if (
      newlyAddedFolderID &&
      newlyAddedFolderID.length > 0 &&
      fileIndex < files.length
    ) {
      addImage.mutate({
        s3ImageURL: s3URLs[fileIndex]!,
        randomizedURL: cryptoRandomString({ length: 5 }),
        title: files[fileIndex]!.title,
        description: files[fileIndex]!.description,
        isPublic: files[fileIndex]!.isPublic,
        userID: session?.user?.id,
        folderID: newlyAddedFolderID,
      });

      setNewlyAddedFolderID(undefined); // preventing rerenders of this effect until new folder id is added
    }
  }, [s3URLs, files, fileIndex, session, newlyAddedFolderID]);

  useEffect(() => {
    if (files.length > 0 && !uploadsHaveStarted) {
      files.map((file) => {
        setUploadsHaveStarted(true);
        S3Client.uploadFile(file.image.imageFile).then((res: IS3Response) =>
          setS3URLs((currentS3URLs) => [...currentS3URLs, res.location])
        );
        // .catch((err) => console.error(err)); find out how to type "err"
      });
    }
  }, [files, uploadsHaveStarted]);

  useEffect(() => {
    if (s3URLs.length === files.length) {
      files.map((file, i) => {
        // need to be logged in to create a folder
        if (
          file.folder &&
          typeof file.folder.id === "undefined" &&
          session?.user?.id
        ) {
          createFolder.mutate({
            title: file.folder.title,
            userID: session.user.id,
          });
        }
        // HAS to be a better/quicker way to narrow that down...
        else if (
          file.folder &&
          file.folder.id &&
          file.folder.id.length > 0 &&
          session?.user?.id
        ) {
          addImage.mutate({
            s3ImageURL: s3URLs[i] ?? "changeLater",
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: session.user.id,
            folderID: file.folder.id,
          });
        } else if (session?.user?.id) {
          addImage.mutate({
            s3ImageURL: s3URLs[i] ?? "changeLater",
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: session.user.id,
          });
        }
      });
    }
  }, [s3URLs, files, session]);

  // have this run for a certain amount of time, or when all files are fully uploaded to db
  // whichever comes first

  return <div>Uploading...</div>;
}

export default UploadProgressModal;

import React, { useState, useEffect } from "react";
import S3 from "aws-s3";
import { trpc } from "../../utils/trpc";

import cryptoRandomString from "crypto-random-string";

import { type IFile } from "./ImageReviewModal";
import { type IImage } from "./DragAndDrop";
import { useSession } from "next-auth/react";

import classes from "./UploadProgressModal.module.css";

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

  // const [newUserID, setNewUserID] = useState<string>();
  const [currentUserID, setCurrentUserID] = useState<string | null>(
    localStorage.getItem("userID")
  );

  useEffect(() => {
    if (session?.user?.id) setCurrentUserID(session.user.id);
  }, [session]);

  // temporary:
  useEffect(() => {
    if (files.length > 0) {
      document.body.style.overflow = "hidden";
    }
  }, [files]);

  // destroys component when all images are inside the database
  if (numImagesInsertedIntoDatabase === files.length && files.length !== 0) {
    document.body.style.overflow = "auto";
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

  const createUser = trpc.images.createNewUser.useMutation({
    onSuccess(data) {
      console.log(data?.id);
      if (data) {
        localStorage.setItem("userID", data.id);
        setCurrentUserID(data.id);
      }
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
      fileIndex < files.length &&
      currentUserID
    ) {
      addImage.mutate({
        s3ImageURL: s3URLs[fileIndex]!,
        randomizedURL: cryptoRandomString({ length: 5 }),
        title: files[fileIndex]!.title,
        description: files[fileIndex]!.description,
        isPublic: files[fileIndex]!.isPublic,
        userID: currentUserID,
        folderID: newlyAddedFolderID,
      });

      setNewlyAddedFolderID(undefined); // preventing rerenders of this effect until new folder id is added
    }
  }, [s3URLs, files, fileIndex, currentUserID, newlyAddedFolderID]);

  useEffect(() => {
    if (files.length > 0 && !uploadsHaveStarted) {
      // maybe this is due to react strictmode being called twice..
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
    if (s3URLs.length === files.length && currentUserID) {
      // switch back to "===" when you figure out double upload issue
      files.map((file, i) => {
        if (file.folder && typeof file.folder.id === "undefined") {
          createFolder.mutate({
            title: file.folder.title,
            userID: currentUserID,
          });
        }
        // HAS to be a better/quicker way to narrow that down...
        else if (file.folder && file.folder.id && file.folder.id.length > 0) {
          addImage.mutate({
            s3ImageURL: s3URLs[i] ?? "changeLater",
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: currentUserID,
            folderID: file.folder.id,
          });
        } else {
          addImage.mutate({
            s3ImageURL: s3URLs[i] ?? "changeLater",
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: currentUserID,
          });
        }
      });
    } else if (s3URLs.length === files.length) {
      // find way to not have to repeat this
      // create new user in db
      createUser.mutate();
    }
  }, [s3URLs, files, currentUserID]);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className={classes.ripple}>
        <div>
          <div></div>
        </div>
      </div>
      Uploading
    </div>
  );
}

export default UploadProgressModal;

import React, { useState, useEffect } from "react";
import S3 from "aws-s3";
import { trpc } from "../../utils/trpc";

import cryptoRandomString from "crypto-random-string";

import { type IFile } from "./ImageReviewModal";
import { type IImage } from "./DragAndDrop";
import { useSession } from "next-auth/react";
import { useLocalStorageContext } from "../../context/LocalStorageContext";

import useScrollModalIntoView from "../../hooks/useScrollModalIntoView";
import StashLogoAnimation from "../logo/StashLogoAnimation";
import { type Folder } from "@prisma/client";
import { type IS3ClientOptions } from "../ImageLibrary/EditImageModal";

export interface IS3Response {
  bucket: string;
  key: string;
  location: string;
}
interface IUploadProgressModal {
  files: IFile[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
}

function UploadProgressModal({ files, setFiles }: IUploadProgressModal) {
  const { data: session, status } = useSession();
  const utils = trpc.useContext();
  const localStorageID = useLocalStorageContext();

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

  const [s3URLs, setS3URLs] = useState<string[]>([]);
  const [uploadsHaveStarted, setUploadsHaveStarted] = useState<boolean>(false);

  const [fileIndex, setFileIndex] = useState<number>(0);
  const [newlyAddedFolder, setNewlyAddedFolder] = useState<Folder>();
  const [numImagesInsertedIntoDatabase, setNumImagesInsertedIntoDatabase] =
    useState<number>(0);

  const [currentUserID, setCurrentUserID] = useState<string | null>(
    localStorage.getItem("userID")
  );

  useEffect(() => {
    if (session?.user?.id) setCurrentUserID(session.user.id);
  }, [session]);

  useScrollModalIntoView();

  // destroys component when all images are inside the database
  if (numImagesInsertedIntoDatabase === files.length && files.length !== 0) {
    document.body.style.overflow = "auto";
    setInterval(() => {
      if (!session?.user) {
        localStorageID?.setValue(currentUserID);
      }
      setFiles([]);
    }, 3000);
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
        setNewlyAddedFolder(data);
      }
    },
    onSettled: () => {
      utils.folders.getUserFolders.invalidate();
    },
  });

  const createUser = trpc.users.createNewUser.useMutation({
    onSuccess(data) {
      if (data) {
        localStorage.setItem("userID", data.id);
        setCurrentUserID(data.id);
      }
    },
  });

  useEffect(() => {
    if (newlyAddedFolder && currentUserID) {
      // verify that this works
      files.map((file, index) => {
        if (file.folder?.label === newlyAddedFolder.title) {
          addImage.mutate({
            s3ImageURL: s3URLs[index]!,
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: currentUserID,
            folderID: newlyAddedFolder.id,
          });
        }
      });

      setNewlyAddedFolder(undefined); // preventing rerenders of this effect until new folder id is added
    }
  }, [s3URLs, files, currentUserID, newlyAddedFolder]);

  useEffect(() => {
    if (files.length > 0 && !uploadsHaveStarted && s3Config) {
      setUploadsHaveStarted(true);

      const S3Client = new S3(s3Config);

      files.map((file) => {
        S3Client.uploadFile(file.image.imageFile).then((res: IS3Response) =>
          setS3URLs((currentS3URLs) => [...currentS3URLs, res.location])
        );
        // .catch((err) => console.error(err)); find out how to type "err"
      });
    }

    return () => {
      setUploadsHaveStarted(true); // probably not right way to do this
    };
  }, [files, uploadsHaveStarted, s3Config]);

  useEffect(() => {
    if (s3URLs.length === files.length && currentUserID) {
      const foldersThatNeedToBeCreated: string[] = []; // is this robust at all?
      files.map((file, i) => {
        if (file.folder && file.folder.value === file.folder.label) {
          // skips over images that will be added in above effect when new
          // folder is created (prevents duplicate folders)
          if (!foldersThatNeedToBeCreated.includes(file.folder.label)) {
            createFolder.mutate({
              title: file.folder.label,
              userID: currentUserID,
            });
            foldersThatNeedToBeCreated.push(file.folder.label);
          }
        } else if (
          file.folder &&
          file.folder.value &&
          file.folder.value.length > 0
        ) {
          addImage.mutate({
            s3ImageURL: s3URLs[i] ?? "changeLater",
            randomizedURL: cryptoRandomString({ length: 5 }),
            title: file.title,
            description: file.description,
            isPublic: file.isPublic,
            userID: currentUserID,
            folderID: file.folder.value,
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
      <StashLogoAnimation size={"6rem"} />
      Uploading
    </div>
  );
}

export default UploadProgressModal;

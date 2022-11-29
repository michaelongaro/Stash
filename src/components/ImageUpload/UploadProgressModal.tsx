import React, { useState, useEffect } from "react";
import S3 from "aws-s3";
import { trpc } from "../../utils/trpc";

import cryptoRandomString from "crypto-random-string";

import { type IFile } from "./ImageReviewModal";
import { type IImage } from "./DragAndDrop";
import { useSession } from "next-auth/react";

const config = {
  bucketName: "stash-resources",
  // dirName: "photos" /* optional */,
  region: "us-east-2",
  accessKeyId: "AKIA3MXYY55AXMHDSQCJ",
  secretAccessKey: "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",
  // s3Url: "https://my-s3-url.com/" /* optional */,
};

const S3Client = new S3(config);

interface IUploadProgressModal {
  files: IFile[];
  setFiles: React.Dispatch<React.SetStateAction<IImage[]>>;
}

function UploadProgressModal({ files, setFiles }: IUploadProgressModal) {
  const { data: session, status } = useSession();
  const { data: allUserFolders } = trpc.images.getUserFolders.useQuery();

  const [s3URLs, setS3URLs] = useState<string[]>([]);
  const [uploadsHaveStarted, setUploadsHaveStarted] = useState<boolean>(false);

  const utils = trpc.useContext();

  // optimistic updating
  const addImage = trpc.images.addImage.useMutation({
    onMutate: () => {
      utils.images.getUserImages.cancel();
      const optimisticUpdate = utils.images.getUserImages.getData();

      if (optimisticUpdate) {
        utils.images.getUserImages.setData(optimisticUpdate);
      }
    },
    onSettled: () => {
      utils.images.getUserImages.invalidate();
    },
  });

  const createFolder = trpc.images.createFolder.useMutation({
    onMutate: () => {
      utils.images.getUserFolders.cancel();
      const optimisticUpdate = utils.images.getUserFolders.getData();

      if (optimisticUpdate) {
        utils.images.getUserFolders.setData(optimisticUpdate);
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
    console.log(files, files.length, uploadsHaveStarted);

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
      // trpc mutate call here
      console.log(s3URLs);

      files.map((file, i) => {
        // if (file.folder && !file.folder.id) {
        //   console.log("trying to create folder");

        //   createFolder.mutate({
        //     title: file.folder.title,
        //     userID: session?.user?.id ?? "random", // for non-registered users, will have to get this from localstorage
        //   });
        // }

        addImage.mutate({
          s3ImageURL: s3URLs[i] ?? "changeThisLater",
          randomizedURL: cryptoRandomString({ length: 5 }),
          title: file.title,
          description: file.description,
          isPublic: file.isPublic,
          userID: session?.user?.id ?? "changeThisLater",
          folderID: file.folder?.id ?? "changeThisLater", // think of a better way to this for all "??" above
        });
      });

      // at end of trpc once everything is fully updated do this:
      setFiles([]);
    }
  }, [s3URLs, files]);

  // have this run for a certain amount of time, or when all files are fully uploaded to db
  // whichever comes first

  return <div>Uploading...</div>;
}

export default UploadProgressModal;

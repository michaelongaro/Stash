import { type Image as PrismaImage } from "@prisma/client";
import React from "react";

import { FaLink } from "react-icons/fa";

import Image from "next/image";

interface IUploadedImage {
  image: PrismaImage;
  setImageBeingEdited: React.Dispatch<
    React.SetStateAction<PrismaImage | undefined>
  >;
}

function UploadedImage({ image, setImageBeingEdited }: IUploadedImage) {
  // not sure if mentioned but maybe have a lock in top left to toggle public/private?
  return (
    <div className="relative flex items-center justify-center">
      {/* how to have dynamic width/height... */}
      <Image
        className="cursor-pointer rounded-md"
        src={image.s3ImageURL}
        alt={image?.title ?? "uploaded image"}
        width={250}
        height={250}
        onClick={() => setImageBeingEdited(image)}
      />

      <div className="absolute bottom-0 left-0 flex w-full items-center justify-center gap-8 bg-slate-300">
        <button onClick={() => setImageBeingEdited(image)}>Edit</button>

        {/* eventually have react-toast notification once clicked */}
        <button onClick={() => navigator.clipboard.writeText(image.s3ImageURL)}>
          <FaLink size={"1rem"} />
        </button>
      </div>
    </div>
  );
}

export default UploadedImage;

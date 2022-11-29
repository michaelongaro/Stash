import React from "react";
import ImageEditor from "@toast-ui/react-image-editor";
import { whiteTheme } from "../../ui/whiteTheme";

interface IImageEditorModal {
  imageFile: File | undefined;
  setImageToBeEdited: React.Dispatch<React.SetStateAction<File | undefined>>;
}

function ImageEditorModal({
  imageFile,
  setImageToBeEdited,
}: IImageEditorModal) {
  if (!imageFile) return <></>;

  return (
    <ImageEditor
      includeUI={{
        loadImage: {
          path: URL.createObjectURL(imageFile),
          name: imageFile.name,
        },
        theme: whiteTheme,
        // menu: ["shape", "filter"],
        initMenu: "crop",
        uiSize: {
          width: "1000px",
          height: "700px",
        },
        menuBarPosition: "right",
      }}
      cssMaxHeight={500}
      cssMaxWidth={700}
      selectionStyle={{
        cornerSize: 20,
        rotatingPointOffset: 70,
      }}
      usageStatistics={true}
    />
  );
}

export default ImageEditorModal;

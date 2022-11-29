import React from "react";
import ImageEditor from "@toast-ui/react-image-editor";

interface IImageEditorModal {
  imageFile: File | undefined;
}

function ImageEditorModal({ imageFile }: IImageEditorModal) {
  const myTheme = {
    // Theme object to extends default dark theme.
  };

  if (!imageFile) return <></>;

  return (
    <ImageEditor
      includeUI={{
        loadImage: {
          path: imageFile,
          name: "SampleImage",
        },
        theme: myTheme,
        menu: ["shape", "filter"],
        initMenu: "filter",
        uiSize: {
          width: "1000px",
          height: "700px",
        },
        menuBarPosition: "bottom",
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

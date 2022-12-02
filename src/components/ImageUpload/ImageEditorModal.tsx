import React, { useRef } from "react";
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
  const imageEditorRef = useRef();

  if (!imageFile) return <></>;

  return (
    <div className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-blue-800/90 transition-all">
      <div className="flex h-full w-full items-center justify-center gap-4">
        <ImageEditor
          ref={imageEditorRef}
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
        <button
          className="secondaryBtn"
          onClick={() => {
            // imageEditorRef.current.toDataUrl();
          }}
        >
          Save changes
        </button>
      </div>
    </div>
  );
}

export default ImageEditorModal;

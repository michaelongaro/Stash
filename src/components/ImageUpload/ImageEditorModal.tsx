import React, { useState, useEffect } from "react";
import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from "react-filerobot-image-editor";
import cryptoRandomString from "crypto-random-string";
import { type IFile } from "../ImageUpload/ImageReviewModal";

interface IImageEditorModal {
  imageToBeEdited: string | File | undefined;
  setImageToBeEdited:
    | React.Dispatch<React.SetStateAction<File | undefined>>
    | React.Dispatch<React.SetStateAction<string | undefined>>;
  setEditedImageFile?: React.Dispatch<React.SetStateAction<File | undefined>>;
  setImageData?: React.Dispatch<React.SetStateAction<IFile[]>>;
  index?: number;
}

function ImageEditorModal({
  imageToBeEdited,
  setEditedImageFile,
  setImageToBeEdited,
  setImageData,
  index,
}: IImageEditorModal) {
  const [imageEditorKey, setImageEditorKey] = useState<string>(
    cryptoRandomString({ length: 5 })
  );

  useEffect(() => {
    resizeHandler();

    function resizeHandler() {
      setImageEditorKey(cryptoRandomString({ length: 5 }));
    }

    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // function to turn base64 string into a file
  function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(",");
    const mime = arr[0]!.match(/:(.*?);/)![1];
    const bstr = atob(arr[1]!);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  if (!imageToBeEdited) return <></>;

  return (
    <div className="fixed top-0 left-0 z-[500] flex h-full w-full items-center justify-center overflow-hidden bg-blue-700/70 transition-all">
      <div className="relative flex h-[95%] flex-col items-center justify-center md:w-[95%] md:gap-0 lg:w-[80%] lg:gap-4">
        <FilerobotImageEditor
          key={imageEditorKey} // workaround to reset the editor when page is resized
          source={
            typeof imageToBeEdited === "string"
              ? imageToBeEdited
              : URL.createObjectURL(imageToBeEdited)
          }
          onBeforeSave={() => false}
          translations={{
            save: "Apply changes",
          }}
          onSave={(editedImageObject, designState) => {
            if (setEditedImageFile) {
              setEditedImageFile(
                dataURLtoFile(editedImageObject.imageBase64!, "editedImage")
              );
            } else if (
              setImageData &&
              index !== undefined &&
              typeof imageToBeEdited !== "string"
            ) {
              setImageData((oldImageData) => {
                const newImageData = [...oldImageData];
                if (newImageData[index]?.image.imageFile) {
                  newImageData[index]!.image.imageFile = dataURLtoFile(
                    editedImageObject.imageBase64!,
                    imageToBeEdited.name
                  );
                }
                return newImageData;
              });
            }
            setImageToBeEdited(undefined);
          }}
          annotationsCommon={{
            fill: "#ff0000",
          }}
          Text={{ text: "Your text here..." }}
          Rotate={{ angle: 90, componentType: "slider" }}
          savingPixelRatio={2} // what do these do
          previewPixelRatio={2} // what do these do
          tabsIds={[TABS.ADJUST, TABS.ANNOTATE, TABS.RESIZE]}
          defaultTabId={TABS.ADJUST}
          defaultToolId={TOOLS.CROP}
        />
        <button
          className="dangerBtn !mt-2 "
          aria-label="Discard changes"
          onClick={() => setImageToBeEdited(undefined)}
        >
          Discard changes
        </button>
      </div>
    </div>
  );
}

export default ImageEditorModal;

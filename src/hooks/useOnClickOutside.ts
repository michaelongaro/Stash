import { useEffect } from "react";

import { type Image } from "@prisma/client";
import { type IImage } from "../components/ImageUpload/DragAndDrop";

interface IOnClickOutside {
  ref: React.RefObject<HTMLDivElement>;
  setter:
    | React.Dispatch<React.SetStateAction<IImage[]>>
    | React.Dispatch<React.SetStateAction<Image | undefined>>
    | React.Dispatch<React.SetStateAction<boolean>>
    | React.Dispatch<React.SetStateAction<string | undefined>>;
  backupSetter?: React.Dispatch<React.SetStateAction<boolean>>;
  hideModalValue: object | boolean | undefined;
  backupHideModalValue?: boolean;
  useBackupSetter?: boolean;
}

export default function useOnClickOutside({
  ref,
  setter,
  backupSetter,
  hideModalValue,
  backupHideModalValue,
  useBackupSetter,
}: IOnClickOutside) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements

      if (
        !ref.current ||
        ref.current.contains(event.target as Node) ||
        event.target?.toString() === "[object SVGPathElement]" ||
        event.target?.toString() === "[object SVGSVGElement]"
      ) {
        return;
      }

      if (useBackupSetter && backupSetter && backupHideModalValue) {
        backupSetter(backupHideModalValue);
      } else {
        // @ts-expect-error - unsure of how to create a generic type for this
        setter(hideModalValue);
      }
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [
    ref,
    backupSetter,
    backupHideModalValue,
    useBackupSetter,
    setter,
    hideModalValue,
  ]);
}

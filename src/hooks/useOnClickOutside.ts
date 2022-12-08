import { useEffect } from "react";

interface IOnClickOutside {
  ref: React.RefObject<HTMLDivElement>;
  setter:
    | React.Dispatch<React.SetStateAction<boolean>>
    | React.Dispatch<React.SetStateAction<string>>;
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
  console.log(backupSetter === undefined, backupHideModalValue === undefined);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements

      if (!ref.current || ref.current.contains(event.target as Node)) {
        console.log("returning");

        return;
      }

      if (useBackupSetter && backupSetter && backupHideModalValue) {
        backupSetter(backupHideModalValue);
      } else {
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

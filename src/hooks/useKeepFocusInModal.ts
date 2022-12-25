import { useEffect } from "react";

interface IKeepFocusInModal {
  modalRef: React.RefObject<HTMLDivElement | null>;
  firstElemRef: React.RefObject<HTMLDivElement | HTMLButtonElement | null>;
  lastElemRef: React.RefObject<HTMLButtonElement | null>;
  closeButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function useKeepFocusInModal({
  modalRef,
  firstElemRef,
  lastElemRef,
  closeButtonRef,
}: IKeepFocusInModal) {
  useEffect(() => {
    setTimeout(() => {
      closeButtonRef?.current?.focus();
    }, 500); // keep an eye on whether this works in production

    function handleKeydown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      // not sure why a single e.preventDefault() didn't work

      if (closeButtonRef) {
        if (document.activeElement === lastElemRef.current) {
          e.preventDefault();
          closeButtonRef?.current?.focus();
        } else if (document.activeElement === closeButtonRef?.current) {
          e.preventDefault();
          firstElemRef?.current?.focus();
        }
      } else {
        if (document.activeElement === lastElemRef.current) {
          e.preventDefault();
          firstElemRef?.current?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeydown);
    const currentModalRef = modalRef;
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      if (currentModalRef.current) {
        currentModalRef.current.blur();
      }
    };
  }, [modalRef, firstElemRef, lastElemRef, closeButtonRef]);
}

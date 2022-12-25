import { useState, useEffect } from "react";

interface IReturnFocusAfterModalClose {
  initiatorElement: React.RefObject<HTMLButtonElement | null>;
  test?: React.RefObject<HTMLDivElement | null>;
  modalOpenedValue: boolean;
}

export default function useReturnFocusAfterModalClose({
  initiatorElement,
  test,
  modalOpenedValue,
}: IReturnFocusAfterModalClose) {
  const [modalIsOpen, setModalIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (modalIsOpen === null && modalOpenedValue) {
      setModalIsOpen(true);
    } else if (modalIsOpen && !modalOpenedValue) {
      setModalIsOpen(false);
    }

    if (modalIsOpen === false) {
      setTimeout(() => test?.current?.focus(), 150);
      setTimeout(() => initiatorElement.current?.focus(), 300);
    }
  }, [modalIsOpen, initiatorElement, test, modalOpenedValue]);
}

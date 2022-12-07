import React, { forwardRef } from "react";
import { Slide, type SlideshowRef } from "react-slideshow-image";

import { type IImage } from "./DragAndDrop";

interface IFileProps {
  // ref: React.RefObject<SlideshowRef>;
  files: IImage[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const Slideshow = forwardRef(function Slideshow(
  props: IFileProps,
  ref: React.Ref<SlideshowRef>
) {
  const { files, index, setIndex } = props;

  const properties = {
    ref: ref,
    autoplay: false,
    transitionDuration: 400,
    pauseOnHover: true,
    arrows: true,
    easing: "ease-in",

    prevArrow: (
      <button data-type="prev" aria-label="Previous Slide">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z"></path>
        </svg>
      </button>
    ),
    nextArrow: (
      <button data-type="next" aria-label="Next Slide">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z"></path>
        </svg>
      </button>
    ),

    indicators: true,
    infinite: true,

    onChange: (prev: number, next: number) => {
      setIndex(next);
    },
  };

  return (
    <Slide {...properties}>
      {files.map((image, index) => (
        <div
          style={{
            aspectRatio: "16/9",
            width: "100%",
          }}
          className="flex items-center justify-center"
          key={index}
        >
          <img
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            draggable="false"
            src={URL.createObjectURL(image.imageFile)}
            alt={`uploaded image #${index + 1}`}
          />
        </div>
      ))}
    </Slide>
  );
});

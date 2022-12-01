import React from "react";
import { Slide } from "react-slideshow-image";

import { type IImage } from "./DragAndDrop";

interface IFileProps {
  files: IImage[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}

function Slideshow({ files, setIndex }: IFileProps) {
  const properties = {
    //  duration: 5000,
    autoplay: false,
    transitionDuration: 400,
    pauseOnHover: true,
    arrows: true,
    easing: "ease-in",

    prevArrow: (
      <button
        style={{ marginRight: "-35px", borderRight: 0, borderTop: 0 }}
        //  className={classes.nav}
        data-type="prev"
        aria-label="Previous Slide"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M16.67 0l2.83 2.829-9.339 9.175 9.339 9.167-2.83 2.829-12.17-11.996z"></path>
        </svg>
      </button>
    ),
    nextArrow: (
      <button
        style={{ marginLeft: "-35px" }}
        //  className={classes.nav}
        data-type="next"
        aria-label="Next Slide"
      >
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
          // className={drawing === undefined ? "" : baseClasses.baseFlex}
          className="flex items-center justify-center"
          key={index}
        >
          <img
            style={{
              // display: imagesFinishedLoading[index] ? "block" : "none",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            draggable="false"
            src={URL.createObjectURL(image.imageFile)}
            alt={`uploaded image #${index + 1}`}
            // onLoad={() => {
            //   setImagesFinishedLoading((prevImages) => {
            //     let newImages = [...prevImages];
            //     newImages[index] = true;
            //     return newImages;
            //   });
            // }}
          />
        </div>
      ))}
    </Slide>
  );
}

export default Slideshow;

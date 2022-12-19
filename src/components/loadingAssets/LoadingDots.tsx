import React from "react";

import ids from "./LoadingDots.module.css";

interface ILoadingDots {
  width: number;
  height: number;
  radius: number;
}

function LoadingDots({ width, height, radius }: ILoadingDots) {
  return (
    <svg
      id={ids.dots}
      width={width}
      height={height}
      viewBox="0 0 132 58"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <title>dots</title>
      <defs></defs>
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id={ids.dots} fill="#A3A3A3">
          <circle id={ids.dot1} cx={25} cy="30" r={radius}></circle>
          <circle id={ids.dot2} cx={65} cy="30" r={radius}></circle>
          <circle id={ids.dot3} cx={105} cy="30" r={radius}></circle>
        </g>
      </g>
    </svg>
  );
}

export default LoadingDots;

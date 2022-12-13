import React from "react";

import classes from "./StashLogoAnimation.module.css";

interface IStashLogoAnimation {
  size: string;
}

function StashLogoAnimation({ size }: IStashLogoAnimation) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 156 157"
      fill="none"
      className={classes.stashLogo}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 144L45.5 78.25L77.5 12.5L142.5 144"
        stroke="rgb(96 165 250)"
        strokeWidth="25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default StashLogoAnimation;

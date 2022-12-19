import { useState } from "react";
import { type IImage } from "../ImageUpload/DragAndDrop";

import LogIn from "../auth/LogIn";
import DragAndDrop from "../ImageUpload/DragAndDrop";

import classes from "./HomePage.module.css";

function HomePage() {
  const [files, setFiles] = useState<IImage[]>([]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center justify-center gap-8 rounded-md bg-blue-500 p-4">
        <h1 className="justify-baseline flex items-center gap-[0.2rem] text-5xl text-blue-200">
          St
          <div className="translate-y-[5px] rotate-180 text-blue-700">v</div>
          sh
        </h1>

        <h2 className="flex flex-col items-center justify-center gap-2 text-blue-200 sm:flex-row">
          your personal vault for all of your
          <div className="flex items-center justify-center gap-2 ">
            <div className="h-[1.5rem] w-[94px] overflow-hidden">
              <ul className={`${classes.tickerList}`}>
                <li>
                  <div>family</div>
                </li>
                <li>
                  <div>private</div>
                </li>
                <li>
                  <div>vacation</div>
                </li>
                <li>
                  <div>homework</div>
                </li>
              </ul>
            </div>
            <div className="text-blue-200">photos</div>
          </div>
        </h2>
      </div>

      <LogIn gap={"1.5rem"} hideLoginButtonAtMobileWidths={false} />

      <DragAndDrop
        renderedLocation={"homepage"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />
    </div>
  );
}

export default HomePage;

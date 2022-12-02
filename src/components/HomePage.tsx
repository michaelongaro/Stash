import { useState } from "react";
import { type IImage } from "./ImageUpload/DragAndDrop";

import LogIn from "./auth/LogIn";
import DragAndDrop from "./ImageUpload/DragAndDrop";

function HomePage() {
  const [files, setFiles] = useState<IImage[]>([]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center justify-center gap-8 rounded-md bg-blue-200 p-4">
        <h1 className="justify-baseline flex items-center gap-[0.2rem] text-5xl text-blue-400">
          St
          <div className="translate-y-[5px] rotate-180 text-blue-700">v</div>
          sh
        </h1>
        {/* maybe have a dynamic part before photos that slides text vertically
      saying like vacation, homework, private idk shouldn't be too hard, maybe there is
      library for it already */}
        <h2 className="text-blue-500">
          your personal vault for all of your photos
        </h2>
      </div>

      <LogIn gap={"1.5rem"} />

      <DragAndDrop
        containerWidth={"30vw"} // make responsive
        containerHeight={"150px"}
        containerBorderRadius={"0.375rem"}
        dragAndDropWidth={"98%"}
        dragAndDropHeight={"90%"}
        dragAndDropBorderRadius={"0.375rem"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />
    </div>
  );
}

export default HomePage;

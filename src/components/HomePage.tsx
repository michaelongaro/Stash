import { useState } from "react";
import { type IImage } from "./ImageUpload/DragAndDrop";

import LogIn from "./auth/LogIn";
import DragAndDrop from "./ImageUpload/DragAndDrop";

function HomePage() {
  const [files, setFiles] = useState<IImage[]>([]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-3xl">Stash</h1>
      {/* maybe have a dynamic part before photos that slides text vertically
      saying like vacation, homework, private idk shouldn't be too hard, maybe there is
      library for it already */}
      <h3>your personal vault for all of your photos</h3>

      <LogIn />

      <DragAndDrop
        containerWidth={"30vw"}
        containerHeight={"150px"}
        containerBorderRadius={"0.375rem"}
        dragAndDropWidth={"95%"}
        dragAndDropHeight={"90%"}
        files={files}
        setFiles={setFiles}
        usedInReviewModal={false}
      />
    </div>
  );
}

export default HomePage;

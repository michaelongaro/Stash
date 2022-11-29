import { useState } from "react";

import LogIn from "./auth/LogIn";

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1>Stash</h1>
      <h3>your personal vault for all of your photos</h3>

      <LogIn />
    </div>
  );
}

export default HomePage;

import { useSession } from "next-auth/react";

import HomePage from "../components/HomePage";
import ImageLibrary from "../components/ImageLibrary/ImageLibrary";

const Home = () => {
  // def don't have to do, but could just have like a whole page spinner (component?)
  // render out while status === loading

  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return <>{session ? <ImageLibrary /> : <HomePage />}</>;
};

export default Home;

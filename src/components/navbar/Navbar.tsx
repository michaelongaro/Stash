import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { FaUserCircle } from "react-icons/fa";
import LogIn from "../auth/LogIn";

function Navbar() {
  const { data: session, status } = useSession();

  console.log(status, session);

  if (
    (status === "loading" || !session?.user) &&
    !localStorage.getItem("userID")
  ) {
    // return <main className="flex flex-col items-center pt-4">Loading...</main>;
    return <></>;
  }

  return (
    <div className="flex h-14 w-[100vw] items-center justify-between bg-blue-600 pl-8 pr-8">
      <div className="justify-baseline flex select-none items-center gap-[0.2rem] text-4xl text-blue-400">
        St
        <div className="translate-y-[4px] rotate-180 text-blue-700">v</div>
        sh
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center justify-center gap-4">
          {session?.user?.image ? (
            <Image
              src={session?.user?.image}
              alt={"profile image"}
              width={48}
              height={48}
              style={{ borderRadius: "50%" }}
            />
          ) : (
            <FaUserCircle size={"2rem"} />
          )}
          <div className="text-blue-50">
            {session?.user?.name ?? session?.user?.email ?? "New user"}
          </div>
        </div>
        {session?.user?.id ? (
          <button
            // className="ml-4 rounded-md bg-blue-200 p-2 text-blue-800 transition-colors hover:bg-blue-500 hover:text-blue-200"
            className="secondaryBtn"
            onClick={() => signOut()}
          >
            Log out
          </button>
        ) : (
          <LogIn gap={"1rem"} />
        )}
      </div>
    </div>
  );
}

export default Navbar;

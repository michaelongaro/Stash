import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { FaUserCircle } from "react-icons/fa";
import LogIn from "../auth/LogIn";

function Navbar() {
  const { data: session, status } = useSession();

  if (
    (status === "loading" || !session?.user) &&
    !localStorage.getItem("userID")
  ) {
    return <></>;
  }

  return (
    <div className="flex h-14 w-[100vw] max-w-full items-center justify-between bg-blue-500 pl-8 pr-8">
      <div className="justify-baseline flex select-none items-center gap-[0.2rem] text-4xl text-blue-200">
        St
        <div className="translate-y-[4px] rotate-180 text-blue-700">v</div>
        sh
      </div>
      <div className="flex items-center justify-center gap-4 md:gap-8">
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
          <div className="hidden text-blue-50 sm:block">
            {session?.user?.name ?? session?.user?.email ?? "New user"}
          </div>
        </div>
        {session?.user?.id ? (
          <button
            className="secondaryBtn"
            aria-aria-label="Log out"
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

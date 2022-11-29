import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

function Navbar() {
  const { data: session, status } = useSession();

  console.log(status, session);

  if (status === "loading" || !session?.user) {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    // look into margin shii so that there is a decent gap on sides
    <div className="flex h-14 items-center justify-between bg-slate-400 pl-4 pr-4">
      Stash Logo
      <div className="flex items-center justify-center gap-2">
        <Image
          src={
            session?.user?.image ??
            "https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png"
          }
          alt={"profile image"}
          width={48}
          height={4}
          style={{ borderRadius: "50%" }}
        />
        {session?.user.name ?? session?.user.email}
        <button
          className="ml-4 rounded-md bg-slate-200 p-2 text-slate-800 transition-colors hover:bg-slate-500 hover:text-slate-200"
          onClick={() => signOut()}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default Navbar;

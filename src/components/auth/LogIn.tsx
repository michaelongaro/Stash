import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { trpc } from "../../utils/trpc";

import { FaEnvelope, FaLock } from "react-icons/fa";

// should just leave props blank if not expecting anything
function LogIn() {
  interface ICredentials {
    email: string;
    password: string;
  }

  const [userCredentials, setUserCredentials] = useState<ICredentials>({
    email: "",
    password: "",
  });
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <div className="flex items-center justify-center gap-8">
        <button onClick={() => setShowModal(true)}>Sign Up</button>
        <button onClick={() => setShowModal(true)}>Log In</button>
      </div>
      <div
        style={{
          opacity: showModal ? 1 : 0,
          pointerEvents: showModal ? "auto" : "none",
        }}
        className="absolute top-0 left-0 z-[500] flex min-h-[100vh] min-w-[100vw] items-center justify-center bg-slate-800 transition-all"
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-md bg-slate-400/75 p-10">
          <form className="flex flex-col items-center justify-center gap-4">
            <label className="flex items-center justify-center gap-3">
              <FaEnvelope size={"1rem"} />
              <input
                className="pl-2 text-stone-800"
                name="username"
                type="text"
                placeholder="Email"
                required
                onChange={(e) => {
                  setUserCredentials({
                    ...userCredentials,
                    email: e.target.value,
                  });
                }}
              />
            </label>
            <label className="flex items-center justify-center gap-3">
              <FaLock size={"1rem"} />
              <input
                className="pl-2 text-stone-800"
                name="password"
                type="password"
                placeholder="Password"
                required
                onChange={(e) => {
                  setUserCredentials({
                    ...userCredentials,
                    password: e.target.value,
                  });
                }}
              />
            </label>
            <button
              className="rounded-md border-2 p-2"
              type="submit"
              onClick={(e) => {
                e.preventDefault();

                signIn("credentials", {
                  email: userCredentials.email,
                  password: userCredentials.password,
                  // redirect: false,
                });
              }}
            >
              Sign in
            </button>
          </form>

          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-auto bg-slate-300"></div>
            <div>or</div>
            <div className="h-1 w-auto bg-slate-300"></div>
          </div>

          <button onClick={() => signIn("google")}>Sign in with Google</button>
          <button onClick={() => signIn("discord")}>
            Sign in with Discord
          </button>
        </div>
      </div>
    </>
  );
}

export default LogIn;

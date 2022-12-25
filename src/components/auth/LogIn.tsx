import React, { useState, useEffect } from "react";

import { AnimatePresence } from "framer-motion";
import OAuthSignInButtons from "./OAuthSignInButtons";

interface ILogIn {
  gap: string;
  hideLoginButtonAtMobileWidths: boolean;
}

function LogIn({ gap, hideLoginButtonAtMobileWidths }: ILogIn) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [hideLogInButton, setHideLogInButton] = useState<boolean>(false);

  useEffect(() => {
    if (hideLoginButtonAtMobileWidths) {
      const handleResize = () => {
        if (window.innerWidth < 500) {
          setHideLogInButton(true);
        } else {
          setHideLogInButton(false);
        }
      };

      handleResize();

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [hideLoginButtonAtMobileWidths]);

  return (
    <>
      <div style={{ gap: gap }} className="flex items-center justify-center">
        <button
          className="primaryBtn"
          aria-label="Sign Up"
          onClick={() => setShowModal(true)}
        >
          Sign Up
        </button>
        <button
          className="secondaryBtn"
          aria-label="Log In"
          style={{ display: hideLogInButton ? "none" : "block" }}
          onClick={() => setShowModal(true)}
        >
          Log In
        </button>
      </div>
      <AnimatePresence
        initial={false}
        mode={"wait"}
        onExitComplete={() => null}
      >
        {showModal && <OAuthSignInButtons setShowModal={setShowModal} />}
      </AnimatePresence>
    </>
  );
}

export default LogIn;

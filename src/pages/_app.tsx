import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Varela_Round } from "@next/font/google";

import { trpc } from "../utils/trpc";

import "../components/ImageUpload/SlideshowStyles.css";
import "react-slideshow-image/dist/styles.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

const varelaRound = Varela_Round({
  weight: "400",
  subsets: ["latin"],
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <main className={varelaRound.className}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);

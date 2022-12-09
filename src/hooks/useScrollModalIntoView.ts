import { useEffect } from "react";

export default function useScrollModalIntoView() {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
}

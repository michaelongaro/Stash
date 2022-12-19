import { toast } from "react-toastify";

export const toastNotification = (text: string) => {
  toast.success(text, {
    position: "bottom-center",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    pauseOnFocusLoss: false,
    theme: "light",
  });
};

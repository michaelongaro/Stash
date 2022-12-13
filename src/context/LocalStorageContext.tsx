import { createContext, useContext, useState, useEffect } from "react";

interface ILocalStorageContext {
  value: string | null;
  setValue: React.Dispatch<React.SetStateAction<string | null>>;
}

const LocalStorageContext = createContext<ILocalStorageContext | null>(null);

export function LocalStorageProvider(props: any) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(localStorage.getItem("userID"));
  }, []);

  const context: ILocalStorageContext = {
    value,
    setValue,
  };

  return (
    <LocalStorageContext.Provider value={context}>
      {props.children}
    </LocalStorageContext.Provider>
  );
}

// export default LocalStorageContext;

export function useLocalStorageContext() {
  return useContext(LocalStorageContext);
}

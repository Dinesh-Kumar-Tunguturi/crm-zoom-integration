"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  loading: boolean;
  message: string;
  setLoading: (value: boolean, message?: string) => void;
}

export const LoadingContext = createContext<LoadingContextType>({
  loading: false,
  message: "",
  setLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoadingState] = useState(false);
  const [message, setMessage] = useState("");

  const setLoading = (value: boolean, message: string = "") => {
    setLoadingState(value);
    setMessage(value ? message : "");
  };

  return (
    <LoadingContext.Provider value={{ loading, setLoading, message }}>
      {children}
    </LoadingContext.Provider>
  );
};

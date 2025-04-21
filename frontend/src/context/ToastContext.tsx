import React, { createContext, useState, useContext, ReactNode } from "react";
import Toast from "../components/Toast";

type ToastType = "success" | "error" | "info";

interface ToastContextProps {
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("info");

  const showToast = (message: string, type: ToastType) => {
    setMessage(message);
    setType(type);
    setShow(true);
  };

  const hideToast = () => {
    setShow(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast show={show} message={message} type={type} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

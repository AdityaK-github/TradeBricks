import React, { useEffect } from "react";
import "../styles/Toast.css";

interface ToastProps {
  show: boolean;
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  show,
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        &times;
      </button>
    </div>
  );
};

export default Toast;

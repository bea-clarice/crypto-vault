// src/components/Toast.jsx
import { useEffect } from "react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return <div className="toast">✓ &nbsp;{message}</div>;
}

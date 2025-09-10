import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState(null);

  function toast(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  const Toast = () =>
    message ? (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow">
        {message}
      </div>
    ) : null;

  return { toast, Toast };
}

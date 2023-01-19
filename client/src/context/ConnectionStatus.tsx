import Button from "@thorium/ui/Button";
import {useEffect, useState} from "react";
import {FaSpinner} from "react-icons/fa";

export const Reconnecting = () => {
  const [timeoutPassed, setTimeoutPassed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutPassed(true);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!timeoutPassed) return null;

  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-70 flex flex-col items-center justify-center space-y-8">
      <h2 className="text-6xl font-bold text-error">
        Reconnecting to Server...
      </h2>
      <FaSpinner className="text-white text-6xl animate-spin-step" />
      <Button
        className="btn btn-primary btn-lg"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reconnect Now
      </Button>
    </div>
  );
};
export const Disconnected = () => {
  return (
    <div className="fixed inset-0 z-30 bg-black bg-opacity-70 flex flex-col items-center justify-center">
      <h2 className="text-6xl font-bold drop-shadow-md filter text-error">
        Disconnected from Server
      </h2>
      <Button
        className="btn btn-primary btn-lg mt-16"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reconnect
      </Button>
    </div>
  );
};

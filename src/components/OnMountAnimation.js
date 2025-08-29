import React, { useEffect, useState } from "react";
import loadingGif from "./images/Happy Dance Sticker by Hai Dudu.gif";

const OnMountAnimation = ({ duration = 2000, onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 50; // update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    const finishTimeout = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [duration, onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f0f] text-white overflow-hidden">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-64 h-64 border-4 border-neutral-800 border-t-purple-700 rounded-full animate-spin"></div>
        <div className="absolute w-24 h-24 rounded-full border border-purple-700/30 animate-ping"></div>
        <div className="absolute w-12 h-12 rounded-full bg-purple-700/20 blur-xl"></div>
        <div className="absolute w-48 h-48 flex items-center justify-center">
          <img
            alt="loading"
            className="h-full w-full object-contain"
            src={loadingGif}
          />
        </div>
      </div>

      <div className="text-center animate-fadeIn mb-6">
        <h1 className="text-4xl font-extrabold tracking-wide bg-gradient-to-r from-indigo-400 to-purple-700 text-transparent bg-clip-text shadow-xl animate-pulse">
          Dome
        </h1>
        <p className="text-sm text-neutral-400 mt-2 animate-pulse">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
};

export default OnMountAnimation;

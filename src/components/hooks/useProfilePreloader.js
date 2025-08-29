import { useState, useEffect } from "react";

export const useProfilePreloader = (src) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    let isCancelled = false;
    const img = new Image();
    img.src = src;
    img.onload = () => !isCancelled && setLoaded(true);
    img.onerror = () => !isCancelled && setLoaded(true);
    return () => {
      isCancelled = true;
    };
  }, [src]);

  return loaded;
};

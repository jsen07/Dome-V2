import { useState, useEffect } from "react";

export function useProfilePreloader(urls = []) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!urls || urls.length === 0) {
      setLoaded(true);
      return;
    }
    let isCancelled = false;
    const images = [];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        images.push(url);
        if (!isCancelled && images.length === urls.length) {
          setLoaded(true);
        }
      };
      img.onerror = () => {
        if (!isCancelled && images.length === urls.length) {
          setLoaded(true);
        }
      };
    });
    return () => {
      isCancelled = true;
    };
  }, [urls]);
  return loaded;
}

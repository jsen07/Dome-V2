import { useState, useEffect, useRef } from "react";

const useDelayedLoading = (loading, delay = 300) => {
  const [showLoading, setShowLoading] = useState(false);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (loading) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setShowLoading(true);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setShowLoading(false);
        hideTimeoutRef.current = null;
      }, delay);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [loading, delay]);

  return showLoading;
};

export default useDelayedLoading;

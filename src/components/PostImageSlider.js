import React, { useState, useRef, useEffect } from "react";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const PostImageSlider = ({ imageUrls, post, likePost }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const hideTimeout = useRef(null);
  const directionLock = useRef(null);

  const showArrowsTemporarily = () => {
    setShowArrows(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowArrows(false), 3000);
  };

  const nextImage = () => {
    if (isTransitioning || currentIndex >= imageUrls.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    directionLock.current = null; // reset at start
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // decide swipe direction once movement passes threshold
    if (directionLock.current === null) {
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        directionLock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
    }

    // if swipe is horizontal, prevent vertical scroll
    if (directionLock.current === "x") {
      e.preventDefault();
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (directionLock.current !== "x") return;

    const distance = touchStartX.current - touchEndX.current;
    const threshold = 70;

    if (distance > threshold) nextImage();
    else if (distance < -threshold) prevImage();

    directionLock.current = null;
  };

  const handleTap = () => showArrowsTemporarily();

  const handleDoubleClick = (e, type, uid, postKey) => {
    e.preventDefault();
    likePost(type, uid, postKey);
  };

  const handleDoubleClickImage = (e, type, uid, postKey) => {
    if (clickTimeout) return;
    handleDoubleClick(e, type, uid, postKey);
    const timeout = setTimeout(() => setClickTimeout(null), 1000);
    setClickTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (clickTimeout) clearTimeout(clickTimeout);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [clickTimeout]);

  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden touch-pan-y"
      onClick={handleTap}
      onMouseEnter={showArrowsTemporarily}
    >
      <div
        className="flex transition-transform duration-300 ease-in-out relative"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`post-${index}`}
            className="w-full flex-shrink-0 max-h-[550px] object-contain md:rounded-sm cursor-pointer"
            draggable={false}
            onMouseDown={(e) => e.preventDefault()}
            onDoubleClick={(e) =>
              handleDoubleClickImage(e, post.type, post.uid, post.postKey)
            }
          />
        ))}
      </div>

      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1/2 cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) =>
          handleDoubleClickImage(e, post.type, post.uid, post.postKey)
        }
        draggable={false}
        onMouseDown={(e) => e.preventDefault()}
      ></div>

      {imageUrls.length > 1 && showArrows && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white bg-black/40 flex items-center justify-center p-2 size-10 rounded-full hover:bg-black/50 transition-opacity text-lg"
          >
            <ArrowBackIosNewIcon style={{ fontSize: "inherit" }} />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-black/40 flex items-center justify-center p-2 size-10 rounded-full hover:bg-black/50 transition-opacity text-lg"
          >
            <ArrowForwardIosIcon style={{ fontSize: "inherit" }} />
          </button>
        </>
      )}

      {imageUrls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {imageUrls.map((_, index) => (
            <span
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? "bg-white" : "bg-gray-600"
              }`}
            ></span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostImageSlider;

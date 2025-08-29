import { useEffect, useState } from "react";

export function useImagePreloader(posts) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!posts.length) return;

    let isCancelled = false;
    setImagesLoaded(false);

    const promises = posts
      .filter((post) => post.imageUrl || post.imageUrls?.length)
      .map((post) => {
        const urls = post.imageUrls || [post.imageUrl];
        return Promise.all(
          urls.map(
            (url) =>
              new Promise((resolve) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = resolve;
              })
          )
        );
      });

    Promise.all(promises).then(() => {
      if (!isCancelled) setImagesLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [posts]);

  return imagesLoaded;
}

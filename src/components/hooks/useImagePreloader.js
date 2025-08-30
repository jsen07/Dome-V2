import { useEffect, useState } from "react";

export function useImagePreloader(posts) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!posts || posts.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let isCancelled = false;
    setImagesLoaded(false);

    const urls = posts.flatMap((post) => {
      if (post.imageUrls && post.imageUrls.length) return post.imageUrls;
      if (post.imageUrl) return [post.imageUrl];
      if (post.photoUrl) return [post.photoUrl];
      return [];
    });

    // console.log(urls);

    if (urls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    const promises = urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            if (img.decode) {
              img.decode().then(resolve).catch(resolve);
            } else {
              resolve();
            }
          };
          img.onerror = resolve;
        })
    );

    Promise.all(promises).then(() => {
      if (!isCancelled) setImagesLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return imagesLoaded;
}

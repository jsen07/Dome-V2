import React, { useEffect } from "react";

const PostsSkeleton = () => {
  useEffect(() => {
    // Disable scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable scrolling when unmounted
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="max-h-screen flex flex-col gap-2 overflow-y-hidden">
      <div className="flex flex-col gap-2 pt-2 pb-6 border-b border-neutral-900 animate-pulse">
        {/* Profile section */}
        <div className="flex flex-row gap-2 pr-2 items-center">
          <div className="w-10 h-10 aspect-square rounded-full bg-neutral-800"></div>

          <div className="w-full flex flex-row justify-between items-center">
            <div className="grow flex flex-col gap-1">
              <div className="h-3 w-24 bg-neutral-800 rounded"></div>
              <div className="h-2 w-16 bg-neutral-800 rounded"></div>
            </div>
            <div className="h-4 w-8 bg-neutral-800 rounded"></div>
          </div>
        </div>

        {/* Image skeleton */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center border-t border-neutral-900 min-h-[300px] relative">
            <div className="w-full h-[300px] md:h-[400px] bg-neutral-800 rounded-sm"></div>
          </div>
        </div>

        {/* Action buttons + likes/comments */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2 items-center text-sm">
            <div className="flex px-2 gap-2 items-center">
              <div className="h-5 w-5 bg-neutral-800 rounded"></div>
              <div className="h-3 w-6 bg-neutral-800 rounded"></div>
            </div>

            <div className="flex px-2 gap-2 items-center">
              <div className="h-5 w-5 bg-neutral-800 rounded"></div>
              <div className="h-3 w-6 bg-neutral-800 rounded"></div>
            </div>

            {/* <div className="ml-auto h-3 w-16 bg-neutral-800 rounded"></div> */}
          </div>

          {/* Post text */}
          <div className="px-2 flex flex-col gap-2">
            <div className="h-3 w-40 bg-neutral-800 rounded"></div>
            <div className="h-3 w-28 bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 pb-6 border-b border-neutral-900 animate-pulse">
        {/* Profile section */}
        <div className="flex flex-row gap-2 pr-2 items-center">
          <div className="w-10 h-10 aspect-square rounded-full bg-neutral-800"></div>

          <div className="w-full flex flex-row justify-between items-center">
            <div className="grow flex flex-col gap-1">
              <div className="h-3 w-24 bg-neutral-800 rounded"></div>
              <div className="h-2 w-16 bg-neutral-800 rounded"></div>
            </div>
            <div className="h-4 w-8 bg-neutral-800 rounded"></div>
          </div>
        </div>

        {/* Image skeleton */}
        <div className="flex flex-col gap-2">
          <div className="w-full h-[200px] md:h-[400px] bg-neutral-800 rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default PostsSkeleton;

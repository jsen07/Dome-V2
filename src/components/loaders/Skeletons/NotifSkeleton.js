import React from "react";

const NotifSkeleton = () => {
  return (
    <div className="flex flex-col pr-2 pl-3 pt-2 pb-4 bg-neutral-900 animate-pulse">
      <div className="h-3 w-16 bg-neutral-700 rounded self-end mb-2" />

      <div className="flex flex-row gap-3 items-center">
        <div className="w-14 h-14 bg-neutral-700 rounded-full" />

        <div className="flex flex-col flex-1">
          <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-neutral-700 rounded w-1/2 mb-4" />

          <div className="flex gap-2">
            <div className="h-6 w-24 bg-violet-700 rounded-lg" />
            <div className="h-6 w-16 bg-neutral-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotifSkeleton;

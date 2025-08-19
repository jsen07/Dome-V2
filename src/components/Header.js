import { useEffect, useRef, useState } from "react";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

export default function Header() {
  const headerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setOpacity(Math.pow(entry.intersectionRatio, 0.5));
      },
      {
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
      }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full">
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          opacity,
          transform: `translateY(-${(1 - opacity) * 100}%)`,
        }}
        className="px-2 py-2 flex items-center justify-between border-b border-neutral-900 text-white bg-neutral-950 sticky top-0 z-50 transition-all duration-300 ease-out"
      >
        {/* Logo */}
        <div className="flex flex-row items-center font-bebas font-bold gap-2">
          <img
            src="/favicon/logo-transparent-cropped-png.png"
            className="w-10"
            alt="dome logo"
          />
          <h1 className="text-xl">
            DOME <span className="text-violet-600 text-2xl">.</span>
          </h1>
        </div>

        {/* Action Button */}

        <SendRoundedIcon className="rotate-[-30deg]" />
      </div>

      <div
        ref={sentinelRef}
        className="absolute top-0 left-0 w-full"
        style={{
          height: headerRef.current?.offsetHeight || 60,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

{
  /* <div className="h-20 sticky top-0 px-3 py-2 flex items-center justify-between border-b border-neutral-900 text-white bg-neutral-950">
        <div className="flex flex-row items-center font-bebas font-bold gap-2">
          <img
            src="/favicon/logo-transparent-cropped-png.png"
            className="w-10"
            alt="dome-logo"
          />
          <h1 className="text-xl">
            {" "}
            DOME <span className="text-violet-600 text-2xl">.</span>
          </h1>
        </div>

        <button>
          <SendRoundedIcon className="rotate-[-30deg]" />
        </button>
      </div> */
}

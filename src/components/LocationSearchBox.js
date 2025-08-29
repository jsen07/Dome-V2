import React, { useState, useEffect, useRef } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import LocationPinIcon from "@mui/icons-material/LocationPin";

const LocationSearchBox = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const token = process.env.REACT_APP_MAPBOX_TOKEN;
  // Fetch Mapbox suggestions
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${token}&autocomplete=true&limit=5`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch Mapbox data");
        }

        const data = await response.json();
        setResults(data.features || []);
      } catch (error) {
        console.error("Mapbox search error:", error);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, 400); // debounce input
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (feature) => {
    setQuery(feature.place_name);
    setResults([]);
    onSelect?.(feature); // send data back to parent
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a location..."
          className="flex-1 px-3 py-2 text-neutral-100 bg-transparent placeholder-neutral-500 focus:outline-none text-sm"
        />
        {loading && (
          <div role="status" className="">
            <svg
              aria-hidden="true"
              class="inline w-6 h-6 animate-spin text-neutral-600 fill-purple-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        )}
        {query ? (
          <button onClick={handleClear} className="px-2">
            <ClearIcon className="text-neutral-400" fontSize="small" />
          </button>
        ) : (
          <div className="text-violet-500 px-2">
            <LocationPinIcon fontSize="medium" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg max-h-60 overflow-y-auto shadow-lg">
          {results.map((feature) => (
            <li
              key={feature.id}
              onClick={() => handleSelect(feature)}
              className="px-3 py-2 cursor-pointer hover:bg-neutral-700 text-neutral-100 text-sm"
            >
              {feature.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearchBox;

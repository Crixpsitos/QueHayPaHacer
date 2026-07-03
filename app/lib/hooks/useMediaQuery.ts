import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Define listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Add listener
    mediaQueryList.addEventListener("change", listener);

    // Clean up
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

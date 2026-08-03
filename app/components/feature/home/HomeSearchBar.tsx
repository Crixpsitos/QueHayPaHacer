"use client";

import { usePathname } from "next/navigation";
import { ExploreSearchBar } from "./ExploreSearchBar";

/** Remounts ExploreSearchBar whenever the user navigates back to the home page. */
export function HomeSearchBar() {
  const pathname = usePathname();
  return <ExploreSearchBar key={pathname} />;
}

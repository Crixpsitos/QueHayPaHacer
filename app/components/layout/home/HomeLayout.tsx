import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { PageContent } from "../shared/PageContent";

interface HomeLayoutProps {
  children: ReactNode;
}

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <PageContent id="main-content" >
        {children}
      </PageContent>
      <Footer />
    </div>
  );
};

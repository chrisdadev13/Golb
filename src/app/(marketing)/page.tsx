import { Atom, BookOpen, Calculator, Code, FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { Hero } from "#/components/marketing/hero";

export const metadata: Metadata = {
  title: "Suma | Learn Anything",
  description: "The best way to learn anything",
};

export default function MarketingPage() {
  return (
    <div className="relative flex w-full flex-col items-center justify-start overflow-x-hidden bg-background">
      <div className="relative flex w-full flex-col items-center justify-start">
        <main className="relative flex w-full max-w-none flex-col items-start justify-start px-4 sm:px-6 md:px-8 lg:w-[1060px] lg:max-w-[1060px] lg:px-0">
          <div className="absolute top-0 left-4 z-0 h-full w-[1px] bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] sm:left-6 md:left-8 lg:left-0" />
          <div className="absolute top-0 right-4 z-0 h-full w-[1px] bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] sm:right-6 md:right-8 lg:right-0" />
          <section className="relative z-10 flex flex-col items-center justify-center gap-4 self-stretch overflow-hidden border-[rgba(55,50,47,0.06)] border-b pt-[9px] sm:gap-6 md:gap-8 lg:gap-[66px]">
            <Hero />
          </section>

          <section className="relative z-10 flex flex-col items-center justify-center gap-8 py-16 px-4 w-full">
            <div className="flex flex-wrap items-center justify-center gap-8 max-w-4xl">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Learn Mathematics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Atom className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Physics
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Chemistry
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Programming
                </span>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Learn Anything!
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
